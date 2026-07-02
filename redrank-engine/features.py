"""
features.py
-----------
Turn a single candidate dict (as read from candidates.jsonl) into a
deterministic feature dict that the scorer can consume.

All computations are pure functions over the candidate data — no I/O, no
randomness. The feature dict is intentionally verbose because reasoning.py
uses it to compose factual reasoning strings from the same underlying data.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Tuple

from utils import (
    ADJACENT_SKILLS,
    CORE_SKILLS,
    NEGATIVE_SKILLS,
    REFERENCE_TODAY,
    STRONG_SKILLS,
    TIER_SCORE,
    canonical_skill,
    clamp,
    degree_level,
    field_bucket,
    months_between,
    norm,
    parse_date,
    safe_log1p,
    title_bucket,
)


# -----------------------------------------------------------------------------#
# Skill features
# -----------------------------------------------------------------------------#
_PROF_WEIGHT: Dict[str, float] = {
    "beginner": 0.30,
    "intermediate": 0.60,
    "advanced": 0.85,
    "expert": 1.00,
}


def _skill_trust_multiplier(endorsements: int, duration_months: int) -> float:
    """A deterministic "trust" multiplier that damps down keyword-stuffed skills.

    Rationale: honeypot / low-effort profiles list many skills with 0
    endorsements and low duration. Genuine skills accrue endorsements and
    real time spent. Multiplier ranges roughly 0.55 - 1.30.
    """
    e = safe_log1p(max(0, endorsements))          # 0..~4
    d = safe_log1p(max(0, duration_months))       # 0..~4.6
    return 0.55 + 0.12 * e + 0.10 * d


def _skill_features(candidate: Dict[str, Any]) -> Dict[str, Any]:
    skills: List[Dict[str, Any]] = candidate.get("skills") or []

    canonical_by_bucket: Dict[str, List[str]] = {
        "core": [], "strong": [], "adjacent": [], "negative": [], "unknown": []
    }
    # Weighted contributions per bucket.
    weighted: Dict[str, float] = {"core": 0.0, "strong": 0.0, "adjacent": 0.0, "negative": 0.0}
    # Weighted endorsements-adjusted contribution — used for keyword-stuffing detection.
    stuffing_ratio_num = 0.0
    stuffing_ratio_den = 0.0

    for s in skills:
        raw_name = s.get("name", "")
        canon = canonical_skill(raw_name)
        prof = norm(s.get("proficiency", ""))
        p_w = _PROF_WEIGHT.get(prof, 0.30)
        endorsements = int(s.get("endorsements", 0) or 0)
        dur = int(s.get("duration_months", 0) or 0)
        trust = _skill_trust_multiplier(endorsements, dur)
        contribution = p_w * trust

        if canon in CORE_SKILLS:
            bucket = "core"
        elif canon in STRONG_SKILLS:
            bucket = "strong"
        elif canon in ADJACENT_SKILLS:
            bucket = "adjacent"
        elif canon in NEGATIVE_SKILLS:
            bucket = "negative"
        else:
            bucket = "unknown"

        canonical_by_bucket[bucket].append(canon)
        if bucket in weighted:
            weighted[bucket] += contribution

        # For core skills, track how much of the claimed weight is backed by
        # real endorsements+duration.
        if bucket == "core":
            stuffing_ratio_num += contribution
            stuffing_ratio_den += p_w * 1.30  # theoretical max trust

    # Normalise skill-overlap score against a realistic top: 5 strong core hits
    # of intermediate+ proficiency ~= 5 * 0.6 * 1.0 = 3.0.
    skill_score = clamp(
        (weighted["core"] * 1.00) + (weighted["strong"] * 0.55) +
        (weighted["adjacent"] * 0.20) - (weighted["negative"] * 0.15),
        lo=0.0,
        hi=6.0,
    ) / 6.0

    # Keyword-stuffing signal: many "core" tags but very little trust.
    stuffing_signal = 0.0
    n_core = len(canonical_by_bucket["core"])
    if n_core >= 5 and stuffing_ratio_den > 0:
        ratio = stuffing_ratio_num / stuffing_ratio_den
        if ratio < 0.35:
            stuffing_signal = clamp((0.35 - ratio) / 0.35, 0.0, 1.0)

    return {
        "skill_score": skill_score,
        "skills_core": canonical_by_bucket["core"],
        "skills_strong": canonical_by_bucket["strong"],
        "skills_adjacent": canonical_by_bucket["adjacent"],
        "skills_negative": canonical_by_bucket["negative"],
        "skills_unknown": canonical_by_bucket["unknown"],
        "skill_weighted": weighted,
        "n_core_skills": n_core,
        "n_strong_skills": len(canonical_by_bucket["strong"]),
        "n_negative_skills": len(canonical_by_bucket["negative"]),
        "stuffing_signal": stuffing_signal,
    }


# -----------------------------------------------------------------------------#
# Title / career features
# -----------------------------------------------------------------------------#
def _career_features(candidate: Dict[str, Any]) -> Dict[str, Any]:
    profile = candidate.get("profile") or {}
    current_title = profile.get("current_title", "")
    current_bucket = title_bucket(current_title)

    history: List[Dict[str, Any]] = candidate.get("career_history") or []
    buckets = [title_bucket(r.get("title", "")) for r in history]

    total_months = 0
    core_months = 0
    adjacent_months = 0
    unrelated_months = 0
    tenures: List[int] = []
    role_count = 0

    for r, b in zip(history, buckets):
        dm = int(r.get("duration_months", 0) or 0)
        total_months += dm
        tenures.append(dm)
        role_count += 1
        if b == "core":
            core_months += dm
        elif b == "adjacent":
            adjacent_months += dm
        else:
            unrelated_months += dm

    if total_months > 0:
        core_ratio = core_months / total_months
        adjacent_ratio = adjacent_months / total_months
        unrelated_ratio = unrelated_months / total_months
    else:
        core_ratio = adjacent_ratio = unrelated_ratio = 0.0

    # Title-match score: current title dominates because it's the strongest
    # signal of current identity; career mix trims or lifts it.
    title_head = {"core": 1.0, "adjacent": 0.55, "unrelated": 0.15}[current_bucket]
    career_mix = 1.0 * core_ratio + 0.55 * adjacent_ratio + 0.15 * unrelated_ratio
    title_score = clamp(0.65 * title_head + 0.35 * career_mix)

    # Job-hopping: many short tenures.
    hop_penalty = 0.0
    non_current_short = 0
    for r, dm in zip(history, tenures):
        if r.get("is_current"):
            continue
        if dm < 12:
            non_current_short += 1
    if role_count >= 3 and non_current_short / max(1, role_count) > 0.5:
        hop_penalty = 0.2 + 0.1 * (non_current_short - 2)
        hop_penalty = clamp(hop_penalty, 0.0, 0.5)

    # Progression: does the most recent role have a higher-seniority word?
    progression_bonus = 0.0
    if history:
        titles_sorted_by_start = sorted(
            history,
            key=lambda r: r.get("start_date") or "",
        )
        first_title = norm(titles_sorted_by_start[0].get("title", ""))
        last_title = norm(titles_sorted_by_start[-1].get("title", ""))
        seniority_words = ("senior", "staff", "principal", "lead", "manager", "head")
        first_sen = any(w in first_title for w in seniority_words)
        last_sen = any(w in last_title for w in seniority_words)
        if last_sen and not first_sen:
            progression_bonus = 0.08

    # Gaps: sum of gap months between consecutive non-current roles.
    gap_months = 0
    dated = []
    for r in history:
        sd = parse_date(r.get("start_date"))
        ed = parse_date(r.get("end_date")) if not r.get("is_current") else REFERENCE_TODAY
        if sd and ed:
            dated.append((sd, ed))
    dated.sort()
    for i in range(1, len(dated)):
        prev_end = dated[i - 1][1]
        cur_start = dated[i][0]
        if cur_start > prev_end:
            gap_months += months_between(prev_end, cur_start)

    return {
        "current_title": current_title,
        "current_title_bucket": current_bucket,
        "career_core_months": core_months,
        "career_adjacent_months": adjacent_months,
        "career_unrelated_months": unrelated_months,
        "career_total_months": total_months,
        "career_core_ratio": core_ratio,
        "career_adjacent_ratio": adjacent_ratio,
        "career_unrelated_ratio": unrelated_ratio,
        "title_score": title_score,
        "hop_penalty": hop_penalty,
        "progression_bonus": progression_bonus,
        "gap_months": gap_months,
        "role_count": role_count,
    }


# -----------------------------------------------------------------------------#
# Experience feature
# -----------------------------------------------------------------------------#
def _experience_features(candidate: Dict[str, Any], jd: Dict[str, Any]) -> Dict[str, Any]:
    yoe = float((candidate.get("profile") or {}).get("years_of_experience") or 0.0)
    lo = float(jd.get("min_yoe", 5.0))
    hi = float(jd.get("max_yoe", 9.0))
    ideal = float(jd.get("ideal_yoe", (lo + hi) / 2.0))

    # Triangular preference window with graceful decay.
    if lo <= yoe <= hi:
        if yoe <= ideal:
            span = max(1e-9, ideal - lo)
            exp_score = 0.7 + 0.3 * ((yoe - lo) / span)
        else:
            span = max(1e-9, hi - ideal)
            exp_score = 1.0 - 0.3 * ((yoe - ideal) / span)
        exp_score = clamp(exp_score, 0.7, 1.0)
    elif yoe < lo:
        # Under-experienced: hard fall-off.
        deficit = lo - yoe
        exp_score = clamp(0.55 - 0.08 * deficit, 0.0, 0.55)
    else:
        # Over-experienced (way senior): still valuable but not the target.
        excess = yoe - hi
        exp_score = clamp(0.60 - 0.04 * excess, 0.15, 0.60)

    return {
        "years_of_experience": yoe,
        "exp_score": clamp(exp_score),
        "exp_ideal": ideal,
    }


# -----------------------------------------------------------------------------#
# Education feature
# -----------------------------------------------------------------------------#
def _education_features(candidate: Dict[str, Any]) -> Dict[str, Any]:
    education: List[Dict[str, Any]] = candidate.get("education") or []
    if not education:
        return {"edu_score": 0.25, "edu_best_field": "", "edu_best_degree": "", "edu_best_tier": ""}

    best = 0.0
    best_field = ""
    best_degree = ""
    best_tier = ""
    for e in education:
        field = e.get("field_of_study", "")
        degree = e.get("degree", "")
        tier = e.get("tier", "unknown")
        fb = field_bucket(field)
        field_score = {"core": 1.0, "adjacent": 0.65, "unrelated": 0.25}[fb]
        deg_score = degree_level(degree)
        tier_score = TIER_SCORE.get(tier, 0.5)
        composite = clamp(0.55 * field_score + 0.25 * deg_score + 0.20 * tier_score)
        if composite > best:
            best = composite
            best_field = field
            best_degree = degree
            best_tier = tier

    return {
        "edu_score": best,
        "edu_best_field": best_field,
        "edu_best_degree": best_degree,
        "edu_best_tier": best_tier,
    }


# -----------------------------------------------------------------------------#
# Redrob signals
# -----------------------------------------------------------------------------#
def _signals_features(candidate: Dict[str, Any], skills_core: Set[str]) -> Dict[str, Any]:
    s = candidate.get("redrob_signals") or {}

    completeness = float(s.get("profile_completeness_score", 0) or 0) / 100.0
    resp_rate = float(s.get("recruiter_response_rate", 0) or 0)
    interview = float(s.get("interview_completion_rate", 0) or 0)
    offer = s.get("offer_acceptance_rate", -1)
    offer_val = 0.5 if offer is None or offer < 0 else float(offer)  # neutral if unknown
    gh = s.get("github_activity_score", -1)
    gh_val = 0.35 if gh is None or gh < 0 else clamp(float(gh) / 100.0)
    endorsements_received = int(s.get("endorsements_received", 0) or 0)
    saved = int(s.get("saved_by_recruiters_30d", 0) or 0)
    views = int(s.get("profile_views_received_30d", 0) or 0)
    connections = int(s.get("connection_count", 0) or 0)
    verified_email = bool(s.get("verified_email", False))
    verified_phone = bool(s.get("verified_phone", False))
    linkedin = bool(s.get("linkedin_connected", False))
    open_to_work = bool(s.get("open_to_work_flag", False))
    willing_relocate = bool(s.get("willing_to_relocate", False))
    notice_days = int(s.get("notice_period_days", 90) or 90)
    work_mode = norm(s.get("preferred_work_mode", ""))
    last_active = parse_date(s.get("last_active_date"))
    if last_active is None:
        active_recency_score = 0.3
        days_inactive = 9999
    else:
        days_inactive = max(0, (REFERENCE_TODAY - last_active).days)
        # 30-day fresh = 1.0, 180-day = 0.5, >365 = ~0.15
        if days_inactive <= 30:
            active_recency_score = 1.0
        elif days_inactive <= 90:
            active_recency_score = 0.85
        elif days_inactive <= 180:
            active_recency_score = 0.65
        elif days_inactive <= 365:
            active_recency_score = 0.4
        else:
            active_recency_score = 0.15

    # Notice period: shorter is (mildly) better.
    if notice_days <= 30:
        notice_score = 1.0
    elif notice_days <= 60:
        notice_score = 0.85
    elif notice_days <= 90:
        notice_score = 0.7
    else:
        notice_score = 0.55

    # Skill assessment: average across relevant (core) skills; if none, neutral.
    assessments = s.get("skill_assessment_scores") or {}
    rel_scores: List[float] = []
    for skill_name, score in assessments.items():
        canon = canonical_skill(skill_name)
        if canon in skills_core:
            try:
                rel_scores.append(float(score) / 100.0)
            except (TypeError, ValueError):
                continue
    if rel_scores:
        assess_score = sum(rel_scores) / len(rel_scores)
    else:
        assess_score = 0.5  # neutral

    # Weighted composite signal (in [0, 1]). Weights tuned to reflect the
    # challenge's emphasis on behavioural predictiveness.
    signal_score = (
        0.14 * completeness +
        0.14 * resp_rate +
        0.10 * interview +
        0.08 * offer_val +
        0.10 * gh_val +
        0.10 * assess_score +
        0.09 * active_recency_score +
        0.05 * clamp(safe_log1p(endorsements_received) / 4.0) +
        0.05 * clamp(safe_log1p(saved) / 3.0) +
        0.04 * clamp(safe_log1p(views) / 4.5) +
        0.04 * clamp(safe_log1p(connections) / 6.5) +
        0.03 * (1.0 if verified_email else 0.0) +
        0.02 * (1.0 if verified_phone else 0.0) +
        0.02 * (1.0 if linkedin else 0.0)
    )
    signal_score = clamp(signal_score)

    # Availability modifier — multiplicative flavour (bounded).
    availability_mod = 1.0
    if open_to_work:
        availability_mod += 0.05
    if willing_relocate:
        availability_mod += 0.02
    if notice_days > 120:
        availability_mod -= 0.05
    availability_mod = clamp(availability_mod, 0.85, 1.10)

    return {
        "completeness": completeness,
        "resp_rate": resp_rate,
        "interview_rate": interview,
        "offer_rate": offer_val,
        "github_norm": gh_val,
        "endorsements_received": endorsements_received,
        "saved_by_recruiters": saved,
        "profile_views": views,
        "connections": connections,
        "verified_email": verified_email,
        "verified_phone": verified_phone,
        "linkedin_connected": linkedin,
        "open_to_work": open_to_work,
        "willing_relocate": willing_relocate,
        "notice_days": notice_days,
        "work_mode": work_mode,
        "days_inactive": days_inactive,
        "active_recency_score": active_recency_score,
        "assess_score_relevant": assess_score,
        "n_assessments_relevant": len(rel_scores),
        "notice_score": notice_score,
        "signal_score": signal_score,
        "availability_mod": availability_mod,
        "has_github": gh not in (None, -1),
    }


# -----------------------------------------------------------------------------#
# Consistency / honeypot detection
# -----------------------------------------------------------------------------#
_MARKETING_SUMMARY_MARKERS = (
    "my professional background is in marketing manager",
    "i've spent my career in marketing manager",
    "i'm a marketing manager",
)


def _consistency_features(candidate: Dict[str, Any], career_bucket: str, skill_stuffing: float) -> Dict[str, Any]:
    """Detect honeypot / inconsistency patterns without hallucinating."""
    profile = candidate.get("profile") or {}
    summary = norm(profile.get("summary", ""))
    headline = norm(profile.get("headline", ""))

    penalties: Dict[str, float] = {}

    # 1. Summary self-describes as marketing while claiming a tech title.
    if any(m in summary for m in _MARKETING_SUMMARY_MARKERS) and career_bucket == "core":
        penalties["marketing_summary_vs_tech_title"] = 0.30

    # 2. High core-skill count with very low trust (keyword stuffing).
    if skill_stuffing > 0:
        penalties["skill_stuffing"] = 0.25 * skill_stuffing

    # 3. Headline claims yrs of experience wildly higher than years_of_experience.
    yoe = float(profile.get("years_of_experience") or 0)
    # Simple regex-free scan for "N yrs" or "N+ yrs" in headline.
    import re
    m = re.search(r"(\d{1,2})\+?\s*yrs", headline)
    if m and yoe > 0:
        claimed = float(m.group(1))
        if abs(claimed - yoe) > 5:
            penalties["headline_yoe_mismatch"] = 0.10

    # 4. career_history description mentions a wildly different function than
    #    the role title (e.g., title = "Backend Engineer" but description = "brand design").
    #    We use a soft heuristic: unrelated_ratio > 0.6 while current title looks core.
    if career_bucket == "core":
        # placeholder; we don't have unrelated_ratio here directly, kept for future use
        pass

    # 5. Contradictory current-title vs skills is checked in extract_features
    #    once the canonicalised skill list is available.

    penalty_total = clamp(sum(penalties.values()), 0.0, 0.55)
    return {
        "consistency_penalties": penalties,
        "consistency_penalty_total": penalty_total,
        "summary_marketing_marker": any(m in summary for m in _MARKETING_SUMMARY_MARKERS),
    }


# -----------------------------------------------------------------------------#
# Top-level feature extraction
# -----------------------------------------------------------------------------#
def extract_features(candidate: Dict[str, Any], jd: Dict[str, Any]) -> Dict[str, Any]:
    """Return a fully-populated feature dictionary for one candidate."""
    skill_f = _skill_features(candidate)
    career_f = _career_features(candidate)
    exp_f = _experience_features(candidate, jd)
    edu_f = _education_features(candidate)
    sig_f = _signals_features(candidate, set(skill_f["skills_core"]))

    consistency = _consistency_features(
        candidate,
        career_bucket=career_f["current_title_bucket"],
        skill_stuffing=skill_f["stuffing_signal"],
    )

    # Extra consistency: current title claims AI/ML but has zero core skills.
    if career_f["current_title_bucket"] == "core" and skill_f["n_core_skills"] == 0:
        consistency["consistency_penalties"]["title_without_core_skills"] = 0.20
        consistency["consistency_penalty_total"] = clamp(
            consistency["consistency_penalty_total"] + 0.20, 0.0, 0.55
        )

    features: Dict[str, Any] = {
        "candidate_id": candidate.get("candidate_id", ""),
    }
    features.update(skill_f)
    features.update(career_f)
    features.update(exp_f)
    features.update(edu_f)
    features.update(sig_f)
    features.update(consistency)
    return features
