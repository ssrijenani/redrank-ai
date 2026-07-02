"""
utils.py
--------
Deterministic utility helpers for the Redrob ranking engine.

Contains:
- Streaming JSONL reader (memory-efficient generator)
- Text normalization / tokenization
- Canonical skill / title vocabularies + synonym map
- Date parsing helpers
- Small deterministic math helpers (no randomness anywhere)
"""

from __future__ import annotations

import json
import math
import os
import re
from datetime import date, datetime
from typing import Any, Dict, Generator, Iterable, List, Optional, Set, Tuple


# -----------------------------------------------------------------------------#
# Streaming JSONL reader
# -----------------------------------------------------------------------------#
def stream_jsonl(path: str) -> Generator[Dict[str, Any], None, None]:
    """Yield one JSON object per line from a JSONL file.

    The file is read line-by-line with a bounded buffer so that a 100k+
    candidate file never has to be held in memory in full.
    Blank lines and lines that fail to parse are skipped with a note printed
    to stderr; they do not abort the pipeline.
    """
    with open(path, "r", encoding="utf-8", buffering=1024 * 1024) as fh:
        for line_no, raw in enumerate(fh, start=1):
            line = raw.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError as exc:
                # Deterministic: skip malformed lines but keep going.
                print(f"[warn] JSONL parse error at line {line_no}: {exc}")
                continue


def count_lines(path: str) -> int:
    """Count non-empty lines in a file without loading it."""
    n = 0
    with open(path, "r", encoding="utf-8", buffering=1024 * 1024) as fh:
        for line in fh:
            if line.strip():
                n += 1
    return n


# -----------------------------------------------------------------------------#
# Text normalization
# -----------------------------------------------------------------------------#
_WORD_RE = re.compile(r"[a-z0-9\+\#\.]+")


def norm(text: Any) -> str:
    """Lower-case, strip, collapse whitespace."""
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)
    return re.sub(r"\s+", " ", text.strip().lower())


def tokens(text: Any) -> Set[str]:
    """Return a set of lowercase alphanumeric tokens."""
    return set(_WORD_RE.findall(norm(text)))


# -----------------------------------------------------------------------------#
# Canonical vocabularies for the Senior AI Engineer JD
# -----------------------------------------------------------------------------#
# NOTE: these are keyed on canonical names. `SKILL_SYNONYMS` maps raw candidate
# skill names / phrases -> canonical name.

# Core "must-have" cluster for a Senior AI/ML Engineer building ranking systems.
CORE_SKILLS: Set[str] = {
    "python", "machine learning", "deep learning", "pytorch", "tensorflow",
    "scikit-learn", "nlp", "llm", "transformers", "fine-tuning llms",
    "embeddings", "vector database", "faiss", "pinecone", "milvus",
    "weaviate", "pgvector", "retrieval", "ranking", "semantic search",
    "rag", "recommendation systems", "information retrieval",
}

# Strong-plus cluster — production ML / MLOps / data infra.
STRONG_SKILLS: Set[str] = {
    "mlops", "model deployment", "onnx", "torchserve", "bentoml", "mlflow",
    "weights & biases", "kubernetes", "docker", "aws", "gcp", "azure",
    "sql", "spark", "airflow", "kafka", "data pipelines",
    "feature engineering", "a/b testing", "experimentation",
    "statistical modeling", "lora", "langchain", "llamaindex",
    "hugging face", "hadoop", "dbt", "databricks", "apache beam",
    "apache flink", "postgresql", "mongodb", "redis",
    "image classification", "object detection", "speech recognition",
    "tts", "gans", "computer vision",
}

# Adjacent cluster — helpful software / infra skills.
ADJACENT_SKILLS: Set[str] = {
    "java", "c++", "rust", "go", "fastapi", "flask", "django", "grpc",
    "graphql", "ci/cd", "terraform", "typescript", "javascript",
    "node.js", "react", "etl", "scrum", "agile",
}

# Skills that are irrelevant or actively negative for this role.
NEGATIVE_SKILLS: Set[str] = {
    "photoshop", "illustrator", "seo", "content writing", "sales",
    "marketing", "tally", "sap", "excel", "powerpoint", "accounting",
    "six sigma", "adobe suite", "figma", "webpack", "redux", "vue.js",
    "angular", "tailwind", "project management",
}

# Map raw skill string (already lowercased) -> canonical.
SKILL_SYNONYMS: Dict[str, str] = {
    "py": "python", "python3": "python", "python 3": "python",
    "ml": "machine learning", "machinelearning": "machine learning",
    "deep-learning": "deep learning", "dl": "deep learning",
    "torch": "pytorch", "tf": "tensorflow", "keras": "tensorflow",
    "sklearn": "scikit-learn", "scikit learn": "scikit-learn",
    "natural language processing": "nlp",
    "large language models": "llm", "llms": "llm", "gpt": "llm",
    "hugging-face": "hugging face", "huggingface": "hugging face",
    "vector db": "vector database", "vectordb": "vector database",
    "vector databases": "vector database",
    "recsys": "recommendation systems",
    "recommender systems": "recommendation systems",
    "recommendation system": "recommendation systems",
    "search": "semantic search",
    "retrieval augmented generation": "rag",
    "wandb": "weights & biases", "w&b": "weights & biases",
    "amazon web services": "aws", "google cloud": "gcp",
    "google cloud platform": "gcp", "microsoft azure": "azure",
    "k8s": "kubernetes", "kube": "kubernetes",
    "postgres": "postgresql", "mongo": "mongodb",
    "apache spark": "spark", "pyspark": "spark",
    "apache kafka": "kafka", "apache airflow": "airflow",
    "cv": "computer vision",
    "content-writing": "content writing", "content marketing": "content writing",
    "ms excel": "excel", "microsoft excel": "excel",
    "adobe photoshop": "photoshop",
}

ALL_KNOWN_SKILLS: Set[str] = CORE_SKILLS | STRONG_SKILLS | ADJACENT_SKILLS | NEGATIVE_SKILLS


def canonical_skill(raw: str) -> str:
    """Return the canonical name for a raw skill string."""
    n = norm(raw)
    if n in SKILL_SYNONYMS:
        return SKILL_SYNONYMS[n]
    return n


# -----------------------------------------------------------------------------#
# Title vocabularies
# -----------------------------------------------------------------------------#
CORE_TITLE_KEYWORDS: List[str] = [
    "ai engineer", "ml engineer", "machine learning engineer",
    "applied scientist", "research engineer", "research scientist",
    "deep learning engineer", "nlp engineer", "mlops engineer",
    "data scientist", "senior ml", "senior ai", "staff ml", "staff ai",
    "principal ml", "principal ai",
]

ADJACENT_TITLE_KEYWORDS: List[str] = [
    "software engineer", "backend engineer", "back-end engineer",
    "full stack developer", "full-stack developer", "data engineer",
    "analytics engineer", "platform engineer", "search engineer",
    "recommendation engineer", "ranking engineer", "sde",
]

# Titles that are actively unrelated to a Senior AI Engineer role.
UNRELATED_TITLE_KEYWORDS: List[str] = [
    "marketing manager", "sales executive", "sales manager",
    "customer support", "customer service", "accountant",
    "hr manager", "human resources", "operations manager",
    "graphic designer", "content writer", "civil engineer",
    "mechanical engineer", "electrical engineer", "chemical engineer",
    "project manager", "business analyst", "product manager",
    "operations", "technician", "receptionist", "assistant",
]


def title_bucket(title: str) -> str:
    """Classify a raw job title into one of: core / adjacent / unrelated."""
    n = norm(title)
    if not n:
        return "unrelated"
    for kw in CORE_TITLE_KEYWORDS:
        if kw in n:
            return "core"
    for kw in ADJACENT_TITLE_KEYWORDS:
        if kw in n:
            return "adjacent"
    for kw in UNRELATED_TITLE_KEYWORDS:
        if kw in n:
            return "unrelated"
    # Default: unrelated is the safe conservative choice for a specialised
    # AI-engineer JD, but treat generic "engineer" / "developer" as adjacent.
    if "engineer" in n or "developer" in n or "programmer" in n:
        return "adjacent"
    return "unrelated"


# -----------------------------------------------------------------------------#
# Education vocabularies
# -----------------------------------------------------------------------------#
CORE_FIELDS: Set[str] = {
    "computer science", "artificial intelligence", "machine learning",
    "data science", "computational science",
}
ADJACENT_FIELDS: Set[str] = {
    "information technology", "electronics", "electrical engineering",
    "mathematics", "statistics", "physics", "software engineering",
    "computer engineering", "electronics and communication",
    "information systems",
}


def field_bucket(field: str) -> str:
    n = norm(field)
    if not n:
        return "unrelated"
    for f in CORE_FIELDS:
        if f in n:
            return "core"
    for f in ADJACENT_FIELDS:
        if f in n:
            return "adjacent"
    return "unrelated"


def degree_level(degree: str) -> float:
    """Return a 0-1 score for degree level."""
    n = norm(degree)
    if not n:
        return 0.0
    if "ph.d" in n or "phd" in n or "doctorate" in n:
        return 1.0
    if any(k in n for k in ("m.tech", "m.e.", "m.s", "msc", "m.sc", "master")):
        return 0.85
    if any(k in n for k in ("b.tech", "b.e.", "b.s", "bsc", "b.sc", "bachelor")):
        return 0.65
    if "diploma" in n:
        return 0.35
    return 0.35


TIER_SCORE: Dict[str, float] = {
    "tier_1": 1.0,
    "tier_2": 0.85,
    "tier_3": 0.65,
    "tier_4": 0.45,
    "unknown": 0.5,
}


# -----------------------------------------------------------------------------#
# Date helpers
# -----------------------------------------------------------------------------#
_DATE_FMTS = ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y")


def parse_date(value: Optional[str]) -> Optional[date]:
    if not value or not isinstance(value, str):
        return None
    for fmt in _DATE_FMTS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def months_between(d1: Optional[date], d2: Optional[date]) -> int:
    if not d1 or not d2:
        return 0
    return max(0, (d2.year - d1.year) * 12 + (d2.month - d1.month))


# Reference "today" — deterministic across runs. We use the max
# last_active_date + signup_date range in the dataset (2026) so use 2026-06-01
# which is safely past the latest observed date and stable regardless of when
# the code runs.
REFERENCE_TODAY: date = date(2026, 6, 1)


# -----------------------------------------------------------------------------#
# Small deterministic math
# -----------------------------------------------------------------------------#
def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    if x < lo:
        return lo
    if x > hi:
        return hi
    return x


def safe_log1p(x: float) -> float:
    return math.log1p(max(0.0, x))


def triangular(x: float, low: float, ideal: float, high: float) -> float:
    """Piecewise-linear 'tent' function.
    Returns 1.0 at ideal, ramps down to 0 outside [low - span, high + span].
    Values outside [low, high] receive a soft penalty but do not go below 0.
    """
    if x <= low or x >= high:
        # Ramp: how far outside are we, relative to the same span?
        span = (high - low) / 2.0
        if span <= 0:
            return 0.0
        if x < low:
            d = (low - x) / span
        else:
            d = (x - high) / span
        return clamp(1.0 - d, 0.0, 1.0) * 0.4  # capped at 0.4 outside window
    if x <= ideal:
        return clamp((x - low) / max(1e-9, ideal - low), 0.0, 1.0)
    return clamp((high - x) / max(1e-9, high - ideal), 0.0, 1.0)


# -----------------------------------------------------------------------------#
# File auto-detection
# -----------------------------------------------------------------------------#
def find_first_existing(paths: Iterable[str]) -> Optional[str]:
    for p in paths:
        if os.path.exists(p):
            return p
    return None


def auto_detect_jd(project_root: str) -> Optional[str]:
    """Locate a job-description file in the project root.

    Priority: explicit filenames first, then any .pdf / .docx / .txt file with
    'job' or 'description' in its name.
    """
    explicit = [
        os.path.join(project_root, "job_description.docx"),
        os.path.join(project_root, "job_description.pdf"),
        os.path.join(project_root, "job_description.txt"),
    ]
    found = find_first_existing(explicit)
    if found:
        return found
    # Fallback: scan directory.
    try:
        entries = sorted(os.listdir(project_root))  # sorted -> deterministic
    except OSError:
        return None
    for name in entries:
        low = name.lower()
        if not (low.endswith(".pdf") or low.endswith(".docx") or low.endswith(".txt")):
            continue
        if "job" in low or "description" in low or "jd" in low or "signal" in low:
            return os.path.join(project_root, name)
    return None


def auto_detect_candidates(project_root: str) -> Optional[str]:
    candidates = [
        os.path.join(project_root, "candidates.jsonl"),
        os.path.join(project_root, "data", "candidates.jsonl"),
        os.path.join(project_root, "sample_candidates.jsonl"),
        os.path.join(project_root, "sample_candidates.json"),
    ]
    return find_first_existing(candidates)
