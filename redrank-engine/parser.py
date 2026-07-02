"""
parser.py
---------
Parse the uploaded job description (PDF / DOCX / plain text) and extract
structured requirements the ranker can consume.

The extraction is deterministic and rule-based; no external models or APIs.
If a JD file cannot be located or parsed, a well-specified fallback for the
Redrob "Senior AI Engineer" role (derived directly from the challenge
document) is used so that ranking still runs.
"""

from __future__ import annotations

import os
import re
from typing import Dict, List, Optional, Set

from utils import (
    ADJACENT_SKILLS,
    ADJACENT_TITLE_KEYWORDS,
    CORE_SKILLS,
    CORE_TITLE_KEYWORDS,
    NEGATIVE_SKILLS,
    STRONG_SKILLS,
    canonical_skill,
    norm,
)


# -----------------------------------------------------------------------------#
# File readers
# -----------------------------------------------------------------------------#
def _read_pdf(path: str) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:  # pragma: no cover - dependency guaranteed by requirements
        return ""
    try:
        reader = PdfReader(path)
        pages: List[str] = []
        for page in reader.pages:
            try:
                pages.append(page.extract_text() or "")
            except Exception:  # noqa: BLE001 - individual page failures shouldn't abort
                pages.append("")
        return "\n".join(pages)
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] PDF parse failed for {path}: {exc}")
        return ""


def _read_docx(path: str) -> str:
    try:
        from docx import Document
    except ImportError:  # pragma: no cover
        return ""
    try:
        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs if p.text)
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] DOCX parse failed for {path}: {exc}")
        return ""


def _read_txt(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read()
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] TXT parse failed for {path}: {exc}")
        return ""


def read_jd_text(path: Optional[str]) -> str:
    if not path or not os.path.exists(path):
        return ""
    low = path.lower()
    if low.endswith(".pdf"):
        text = _read_pdf(path)
    elif low.endswith(".docx"):
        text = _read_docx(path)
    else:
        text = _read_txt(path)
    return text or ""


# -----------------------------------------------------------------------------#
# Requirement extraction
# -----------------------------------------------------------------------------#
# All curated skill phrases we look for inside the JD text.
_KNOWN_PHRASES: List[str] = sorted(
    (CORE_SKILLS | STRONG_SKILLS | ADJACENT_SKILLS) | {
        "recommendation", "retrieval", "ranking", "hybrid search",
        "vector search", "embedding", "reranking", "search relevance",
        "ndcg", "mrr", "map", "a/b test", "evaluation",
    },
    key=len,
    reverse=True,  # longest first so "vector database" wins over "vector"
)

_YOE_RE = re.compile(
    r"(?P<lo>\d{1,2})\s*[\-\u2013to]{1,3}\s*(?P<hi>\d{1,2})\s*(?:\+?\s*)?"
    r"(?:years|yrs|yr)",
    re.IGNORECASE,
)
_YOE_SINGLE_RE = re.compile(
    r"(?P<lo>\d{1,2})\s*\+\s*(?:years|yrs|yr)",
    re.IGNORECASE,
)


def _extract_yoe(text: str) -> Dict[str, float]:
    """Extract experience window (low, ideal, high) from the JD text."""
    lo: Optional[int] = None
    hi: Optional[int] = None
    m = _YOE_RE.search(text)
    if m:
        lo, hi = int(m.group("lo")), int(m.group("hi"))
    else:
        m2 = _YOE_SINGLE_RE.search(text)
        if m2:
            lo = int(m2.group("lo"))
            hi = lo + 5
    if lo is None or hi is None or lo > hi:
        # Fallback matches the JD document (Senior AI Engineer, 5-9 years).
        lo, hi = 5, 9
    ideal = (lo + hi) / 2.0
    return {"min_yoe": float(lo), "ideal_yoe": float(ideal), "max_yoe": float(hi)}


def _extract_phrases(text: str) -> Set[str]:
    hits: Set[str] = set()
    low = norm(text)
    if not low:
        return hits
    for phrase in _KNOWN_PHRASES:
        # word-boundary-ish: check the phrase appears delimited by non-word
        # characters or edges so that "sql" doesn't match "postgresql".
        p = re.escape(phrase)
        pattern = rf"(?<![a-z0-9]){p}(?![a-z0-9])"
        if re.search(pattern, low):
            hits.add(canonical_skill(phrase))
    return hits


def _extract_titles(text: str) -> Set[str]:
    low = norm(text)
    titles: Set[str] = set()
    for kw in CORE_TITLE_KEYWORDS + ADJACENT_TITLE_KEYWORDS:
        if kw in low:
            titles.add(kw)
    return titles


def _extract_domain(text: str) -> Set[str]:
    """Very lightweight domain tagging by keyword."""
    low = norm(text)
    tags: Set[str] = set()
    checks = {
        "talent intelligence": ("talent", "hr-tech", "hr tech", "recruit", "hiring", "candidate"),
        "search & ranking": ("ranking", "retrieval", "search", "recommendation", "recsys"),
        "generative ai": ("llm", "gen ai", "generative", "gpt", "transformer"),
        "mlops": ("mlops", "production", "deploy", "monitor", "drift"),
    }
    for tag, keys in checks.items():
        if any(k in low for k in keys):
            tags.add(tag)
    return tags


# -----------------------------------------------------------------------------#
# Fallback requirements (derived from the uploaded Redrob challenge document)
# -----------------------------------------------------------------------------#
_FALLBACK_REQS: Dict[str, object] = {
    "role_title": "Senior AI Engineer",
    "seniority": "senior",
    "min_yoe": 5.0,
    "ideal_yoe": 7.0,
    "max_yoe": 9.0,
    "core_skills": sorted(CORE_SKILLS),
    "strong_skills": sorted(STRONG_SKILLS),
    "adjacent_skills": sorted(ADJACENT_SKILLS),
    "negative_skills": sorted(NEGATIVE_SKILLS),
    "core_titles": list(CORE_TITLE_KEYWORDS),
    "adjacent_titles": list(ADJACENT_TITLE_KEYWORDS),
    "domain_tags": ["talent intelligence", "search & ranking", "generative ai", "mlops"],
    "keywords": [
        "python", "ranking", "retrieval", "embeddings", "vector database",
        "llm", "fine-tuning", "recommendation systems", "mlops",
        "production", "shipping",
    ],
    "raw_text_present": False,
}


def parse_job_description(path: Optional[str]) -> Dict[str, object]:
    """Return a structured requirements dict.

    The extractor always augments the fallback JD (never replaces it), so that
    even a sparse PDF still yields the full skill vocabulary the ranker needs.
    Anything found in the raw JD text is layered on top and marked as
    "explicit" so downstream reasoning can hint at real matches.
    """
    text = read_jd_text(path) if path else ""
    reqs: Dict[str, object] = dict(_FALLBACK_REQS)  # copy
    if not text.strip():
        return reqs

    reqs["raw_text_present"] = True

    yoe = _extract_yoe(text)
    reqs.update(yoe)  # type: ignore[arg-type]

    explicit_skills = _extract_phrases(text)
    if explicit_skills:
        reqs["explicit_skills"] = sorted(explicit_skills)

    explicit_titles = _extract_titles(text)
    if explicit_titles:
        reqs["explicit_titles"] = sorted(explicit_titles)

    domains = _extract_domain(text)
    if domains:
        # merge with fallback tags deterministically
        reqs["domain_tags"] = sorted(set(reqs["domain_tags"]) | domains)  # type: ignore[arg-type]

    # Detect explicit role title in the JD if present.
    low = norm(text)
    for kw in CORE_TITLE_KEYWORDS:
        if kw in low:
            reqs["role_title"] = kw.title()
            break

    return reqs
