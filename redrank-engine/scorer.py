"""
scorer.py
---------
Deterministic weighted scorer that turns the feature dict into a single
0-1 score plus a breakdown of contributions.

Weights are fixed constants — no learning, no randomness. The final score is
a linear combination of five *content* components (skills, title/career,
experience, education, signals) plus a multiplicative behavioural modifier
and additive penalties. This matches the "explicit reasoning capture" style
recommended for the Redrob challenge.
"""

from __future__ import annotations

from typing import Any, Dict, Tuple

from utils import clamp


# Component weights (must sum to 1.0 for the linear part).
WEIGHTS: Dict[str, float] = {
    "skills": 0.32,
    "title": 0.22,
    "experience": 0.14,
    "education": 0.06,
    "signals": 0.26,
}
assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9


def score_candidate(features: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
    """Return (final_score in [0,1], breakdown dict)."""
    skills = float(features.get("skill_score", 0.0))
    title = float(features.get("title_score", 0.0))
    exp = float(features.get("exp_score", 0.0))
    edu = float(features.get("edu_score", 0.0))
    sig = float(features.get("signal_score", 0.0))

    linear = (
        WEIGHTS["skills"] * skills
        + WEIGHTS["title"] * title
        + WEIGHTS["experience"] * exp
        + WEIGHTS["education"] * edu
        + WEIGHTS["signals"] * sig
    )

    # Career-quality adjustments (additive, small).
    hop_penalty = float(features.get("hop_penalty", 0.0))
    progression_bonus = float(features.get("progression_bonus", 0.0))
    gap_months = int(features.get("gap_months", 0))
    gap_penalty = 0.0
    if gap_months >= 12:
        gap_penalty = min(0.10, 0.01 * (gap_months - 6))

    # Consistency / honeypot penalties (additive).
    consistency_penalty = float(features.get("consistency_penalty_total", 0.0))

    # Behavioural / availability modifier (multiplicative but bounded).
    availability_mod = float(features.get("availability_mod", 1.0))

    raw = linear * availability_mod
    raw = raw - hop_penalty - gap_penalty - consistency_penalty + progression_bonus

    final = clamp(raw, 0.0, 1.0)

    breakdown = {
        "linear": linear,
        "skills_contrib": WEIGHTS["skills"] * skills,
        "title_contrib": WEIGHTS["title"] * title,
        "experience_contrib": WEIGHTS["experience"] * exp,
        "education_contrib": WEIGHTS["education"] * edu,
        "signals_contrib": WEIGHTS["signals"] * sig,
        "availability_mod": availability_mod,
        "hop_penalty": hop_penalty,
        "gap_penalty": gap_penalty,
        "consistency_penalty": consistency_penalty,
        "progression_bonus": progression_bonus,
        "final": final,
    }
    return final, breakdown
