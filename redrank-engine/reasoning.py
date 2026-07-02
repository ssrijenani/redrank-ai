"""
reasoning.py
------------
Compose a concise, factual reasoning string for each ranked candidate using
only actual candidate data. No hallucinations, no filler.

The output is bounded in length (default 240 characters) and always contains
at least: current title, years of experience, and one differentiating signal.
Templates vary by which factors dominated the score so the strings are not
repetitive across the top-N.
"""

from __future__ import annotations

from typing import Any, Dict, List

_MAX_LEN = 240


def _fmt_pct(x: float) -> str:
    return f"{100.0 * x:.0f}%"


def _pick_top_skills(features: Dict[str, Any], k: int = 4) -> List[str]:
    """Pick the top-k canonical skills from core, then strong, then adjacent."""
    core = features.get("skills_core", []) or []
    strong = features.get("skills_strong", []) or []
    ordered: List[str] = []
    seen: set = set()
    for s in list(core) + list(strong):
        if s not in seen:
            ordered.append(s)
            seen.add(s)
        if len(ordered) >= k:
            break
    return ordered


def _clip(text: str, max_len: int = _MAX_LEN) -> str:
    text = text.strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip(",;: ") + "\u2026"


def compose_reasoning(features: Dict[str, Any], breakdown: Dict[str, float]) -> str:
    """Return a single-line reasoning string strictly grounded in features."""
    title = features.get("current_title", "") or "Candidate"
    yoe = features.get("years_of_experience", 0.0)
    yrs_s = f"{yoe:.1f} yrs"

    top_skills = _pick_top_skills(features, k=4)
    n_core = int(features.get("n_core_skills", 0))
    n_strong = int(features.get("n_strong_skills", 0))
    resp = float(features.get("resp_rate", 0.0))
    completeness = float(features.get("completeness", 0.0))
    gh = float(features.get("github_norm", 0.0))
    has_gh = bool(features.get("has_github", False))
    interview = float(features.get("interview_rate", 0.0))
    saves = int(features.get("saved_by_recruiters", 0))
    endorsements = int(features.get("endorsements_received", 0))
    core_months = int(features.get("career_core_months", 0))
    edu_field = features.get("edu_best_field", "") or ""
    edu_degree = features.get("edu_best_degree", "") or ""
    edu_tier = features.get("edu_best_tier", "") or ""
    notice = int(features.get("notice_days", 0))
    open_work = bool(features.get("open_to_work", False))
    stuffing = float(features.get("stuffing_signal", 0.0))
    marketing_marker = bool(features.get("summary_marketing_marker", False))
    consistency_penalty = float(features.get("consistency_penalty_total", 0.0))
    career_core_ratio = float(features.get("career_core_ratio", 0.0))
    days_inactive = int(features.get("days_inactive", 0))

    parts: List[str] = []

    # Segment 1: identity + relevance verdict
    if features.get("current_title_bucket") == "core":
        parts.append(f"{title} ({yrs_s})")
    elif features.get("current_title_bucket") == "adjacent":
        parts.append(f"{title} ({yrs_s}), adjacent to AI/ML")
    else:
        parts.append(f"{title} ({yrs_s}), off-domain for AI/ML")

    # Segment 2: skill evidence
    if top_skills:
        skills_str = ", ".join(top_skills)
        if n_core >= 3:
            parts.append(f"{n_core} core skills incl. {skills_str}")
        elif n_core >= 1:
            parts.append(f"{n_core} core + {n_strong} strong skills: {skills_str}")
        else:
            parts.append(f"no core AI skills; strengths: {skills_str}")
    else:
        parts.append("no relevant technical skills listed")

    # Segment 3: career depth in domain
    if career_core_ratio >= 0.6 and core_months >= 24:
        parts.append(f"{core_months} months in core roles ({_fmt_pct(career_core_ratio)} of career)")
    elif career_core_ratio > 0 and core_months >= 12:
        parts.append(f"only {core_months} months in core roles")
    elif career_core_ratio == 0 and features.get("career_total_months", 0) > 0:
        parts.append("no prior AI/ML role")

    # Segment 4: engagement signals
    sig_bits: List[str] = []
    if completeness >= 0.7:
        sig_bits.append(f"profile {_fmt_pct(completeness)} complete")
    elif completeness > 0:
        sig_bits.append(f"profile only {_fmt_pct(completeness)} complete")
    sig_bits.append(f"recruiter response {resp:.2f}")
    if has_gh and gh >= 0.2:
        sig_bits.append(f"GitHub {gh * 100:.0f}/100")
    elif not has_gh:
        sig_bits.append("no GitHub linked")
    if interview >= 0.6:
        sig_bits.append(f"interview completion {_fmt_pct(interview)}")
    if saves >= 5:
        sig_bits.append(f"{saves} recruiter saves/30d")
    if endorsements >= 30:
        sig_bits.append(f"{endorsements} endorsements")
    if sig_bits:
        parts.append("; ".join(sig_bits))

    # Segment 5: red flags (only if actually present)
    red: List[str] = []
    if stuffing > 0.4:
        red.append("skill-list looks keyword-stuffed (low endorsements/duration)")
    if marketing_marker and features.get("current_title_bucket") == "core":
        red.append("summary self-describes as marketing role")
    if consistency_penalty >= 0.2 and not red:
        red.append("profile inconsistent with claimed title")
    if features.get("hop_penalty", 0) >= 0.15:
        red.append("frequent short tenures")
    if features.get("gap_months", 0) >= 18:
        red.append(f"{features['gap_months']} months of employment gaps")
    if days_inactive > 180:
        red.append(f"inactive {days_inactive}d")
    if notice > 120:
        red.append(f"{notice}d notice period")
    if not open_work and features.get("current_title_bucket") != "core":
        red.append("not marked open to work")
    if red:
        parts.append("flags: " + "; ".join(red))

    # Segment 6: education (only when it moves the needle)
    if edu_field and edu_degree:
        if features.get("edu_score", 0.0) >= 0.75:
            parts.append(f"{edu_degree} in {edu_field} ({edu_tier})")

    text = ". ".join(p for p in parts if p) + "."
    # Collapse internal double punctuation.
    text = text.replace("..", ".").replace(" .", ".")
    return _clip(text)
