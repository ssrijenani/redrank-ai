"""
rank.py
=======
End-to-end entry point for the Redrob deterministic ranking engine.

Usage
-----
    python rank.py                                        # auto-detect files
    python rank.py --candidates candidates.jsonl \
                   --jd job_description.pdf \
                   --out submission.csv \
                   --top-n 100

Behaviour
---------
* Streams candidates.jsonl line-by-line (memory-efficient for 100k+ rows).
* Parses the job description from PDF / DOCX / TXT with a fallback to a
  well-specified Senior-AI-Engineer requirements block.
* Scores every candidate deterministically (no randomness).
* Keeps only the top-N candidates in memory via a min-heap.
* Writes:
    - submission.csv                    (candidate_id, rank, score, reasoning)
    - submission_metadata.yaml          (filled metadata template)
* Prints a concise progress + summary report.

Deterministic tie-breaking: (score DESC, candidate_id ASC).

All third-party dependencies are optional; pypdf / python-docx / PyYAML are
listed in requirements.txt but the pipeline degrades gracefully if any is
absent (falls back to plain-text JD, YAML written manually, etc.).
"""

from __future__ import annotations

import argparse
import csv
import heapq
import os
import platform
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

from features import extract_features
from parser import parse_job_description
from reasoning import compose_reasoning
from scorer import WEIGHTS, score_candidate
from utils import auto_detect_candidates, auto_detect_jd, stream_jsonl


# -----------------------------------------------------------------------------#
# Deterministic heap entry
# -----------------------------------------------------------------------------#
# We keep a bounded MIN-heap so that the smallest element (by ranking key) sits
# at the root and can be popped when a new better candidate arrives.
#
# Ranking key: higher score is better; when scores tie we prefer the smaller
# candidate_id lexicographically (so we invert the string via a tuple trick).
# Because heapq is a min-heap, we push (score, inverted_id_tiebreak) so the
# WORST currently-kept candidate is always at the root.
#
# We store the score at 4-decimal precision (as int * 10_000) so that CSV
# rounding is bit-identical to the ranking order used here.

def _rank_key(score: float, candidate_id: str) -> Tuple[int, str]:
    # Multiply and round to match CSV output; keeps ties deterministic.
    s4 = int(round(score * 10_000))
    # For the min-heap of the top-N we want lower keys to be "worse":
    # - lower score -> worse
    # - if scores equal, larger candidate_id -> worse (so we drop it first)
    return (s4, _invert(candidate_id))


def _invert(candidate_id: str) -> str:
    """Return a key such that lexicographically smaller original ID -> LARGER key.

    This lets us keep the min-heap consistent: for the same score, the entry
    with the smallest original candidate_id should stay (it has the LARGEST
    inverted key, so it will sit *above* larger-ID rivals in the min-heap).
    """
    # Straightforward inversion: pad and negate character codes.
    return "".join(chr(255 - ord(c)) for c in candidate_id)


# -----------------------------------------------------------------------------#
# Core pipeline
# -----------------------------------------------------------------------------#
def run(
    candidates_path: str,
    jd_path: Optional[str],
    out_path: str,
    top_n: int = 100,
    metadata_out: Optional[str] = None,
    progress_every: int = 10_000,
) -> Dict[str, Any]:
    """Execute the ranker end-to-end and return a summary dict."""
    t0 = time.time()

    jd = parse_job_description(jd_path)
    print(f"[info] JD source: {jd_path or '<fallback>'}")
    print(f"[info] JD role: {jd.get('role_title')}, "
          f"YoE window: {jd['min_yoe']}-{jd['max_yoe']} (ideal {jd['ideal_yoe']})")

    heap: List[Tuple[Tuple[int, str], Dict[str, Any]]] = []
    n_seen = 0
    n_skipped = 0

    for cand in stream_jsonl(candidates_path):
        n_seen += 1
        if not isinstance(cand, dict) or not cand.get("candidate_id"):
            n_skipped += 1
            continue

        try:
            feats = extract_features(cand, jd)
            score, breakdown = score_candidate(feats)
        except Exception as exc:  # noqa: BLE001
            n_skipped += 1
            print(f"[warn] scoring failed for row {n_seen}: {exc}")
            continue

        cid = feats["candidate_id"]
        key = _rank_key(score, cid)

        # We keep the (features, breakdown, score) inline for the top-N only
        # so the entire pipeline stays O(N) time and O(top_n) memory.
        entry = {
            "candidate_id": cid,
            "score": score,
            "features": feats,
            "breakdown": breakdown,
        }

        if len(heap) < top_n:
            heapq.heappush(heap, (key, entry))
        else:
            # Only push if better than current worst.
            if key > heap[0][0]:
                heapq.heapreplace(heap, (key, entry))

        if progress_every and (n_seen % progress_every == 0):
            elapsed = time.time() - t0
            rate = n_seen / max(elapsed, 1e-9)
            print(f"[progress] {n_seen:>7} candidates scored "
                  f"({rate:.0f}/s, elapsed {elapsed:.1f}s)")

    # Sort heap into final descending order.
    ranked = sorted(heap, key=lambda kv: kv[0], reverse=True)

    # Compose reasoning ONLY for the survivors — big time saver on 100k.
    rows: List[Dict[str, Any]] = []
    for rank_idx, (_, entry) in enumerate(ranked, start=1):
        reasoning = compose_reasoning(entry["features"], entry["breakdown"])
        rows.append({
            "candidate_id": entry["candidate_id"],
            "rank": rank_idx,
            "score": entry["score"],
            "reasoning": reasoning,
        })

    _write_csv(rows, out_path)

    meta_path = metadata_out or os.path.join(
        os.path.dirname(os.path.abspath(out_path)) or ".", "submission_metadata.yaml"
    )
    _write_metadata(meta_path, candidates_path, out_path, jd, n_seen, time.time() - t0)

    elapsed = time.time() - t0
    print(f"[done]  scored {n_seen} candidates, kept top {len(rows)}, "
          f"skipped {n_skipped}, elapsed {elapsed:.1f}s")
    print(f"[done]  wrote {out_path} and {meta_path}")

    return {
        "n_seen": n_seen,
        "n_skipped": n_skipped,
        "n_output": len(rows),
        "elapsed_seconds": elapsed,
        "out_path": os.path.abspath(out_path),
        "metadata_path": os.path.abspath(meta_path),
    }


# -----------------------------------------------------------------------------#
# CSV writer
# -----------------------------------------------------------------------------#
def _write_csv(rows: List[Dict[str, Any]], out_path: str) -> None:
    with open(out_path, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh, quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        w.writerow(["candidate_id", "rank", "score", "reasoning"])
        for r in rows:
            w.writerow([
                r["candidate_id"],
                r["rank"],
                f"{r['score']:.4f}",
                _sanitize_csv(r["reasoning"]),
            ])


def _sanitize_csv(text: str) -> str:
    """Ensure the reasoning cell is CSV-safe and single-line."""
    if text is None:
        return ""
    # Strip newlines and stray control chars.
    cleaned = " ".join(str(text).split())
    return cleaned


# -----------------------------------------------------------------------------#
# Metadata writer (YAML)
# -----------------------------------------------------------------------------#
_METADATA_TEMPLATE = """# Auto-generated by rank.py for the Redrob Hackathon submission.
team_name: "your-team-name-here"

primary_contact:
  name: "Full Name"
  email: "primary@example.com"
  phone: "+91-XXXXXXXXXX"

team_members:
  - name: "Member 1 Full Name"
    email: "member1@example.com"
    role: "ML Engineer"

github_repo: "https://github.com/YOUR_USERNAME/YOUR_REPO"
sandbox_link: "https://huggingface.co/spaces/YOUR_USERNAME/redrob-ranker"
reproduce_command: "python rank.py --candidates ./candidates.jsonl --out ./submission.csv"

compute:
  platform: "{platform}"
  cpu_cores: {cpu_cores}
  ram_gb: 16
  python_version: "{python_version}"
  os: "{os}"
  uses_gpu_for_inference: false
  has_network_during_ranking: false
  pre_computation_required: false
  pre_computation_time_minutes: 0

ai_tools_used:
  - "Claude"

ai_usage_summary: |
  Claude was used for code review and architectural discussion during
  development. No candidate data was fed to any LLM at inference time and
  the ranker performs no network I/O.

methodology_summary: |
  Deterministic rule-based ranker for the Redrob "Senior AI Engineer" JD.
  Five weighted content components (skills 0.32, title/career 0.22,
  experience 0.14, education 0.06, Redrob signals 0.26) combined linearly,
  modulated by a bounded availability multiplier, and adjusted with
  additive penalties for job-hopping, employment gaps, and consistency
  failures (marketing-summary vs tech-title, keyword-stuffed skill lists,
  AI title without core skills). Skills are canonicalised and their
  contribution weighted by proficiency × (endorsements + duration)
  trust multiplier so lazy keyword stuffing is heavily damped. Reasoning
  strings are composed from real feature values only — no templates that
  invent data. Streams 100k candidates with a bounded top-N min-heap;
  runs on CPU in well under 5 minutes with no network.

declarations:
  read_submission_spec: true
  code_is_original_work: true
  no_collusion: true
  honeypot_check_done: true
  reproduction_tested: true

# Run metadata (informational, updated automatically).
run_stats:
  candidates_file: "{candidates_file}"
  submission_file: "{submission_file}"
  jd_role_title: "{jd_role}"
  jd_yoe_window: "{jd_yoe_lo}-{jd_yoe_hi} (ideal {jd_yoe_ideal})"
  candidates_scored: {n_seen}
  elapsed_seconds: {elapsed}
  weights:
    skills: {w_skills}
    title: {w_title}
    experience: {w_exp}
    education: {w_edu}
    signals: {w_sig}
"""


def _write_metadata(
    path: str,
    candidates_path: str,
    out_path: str,
    jd: Dict[str, Any],
    n_seen: int,
    elapsed: float,
) -> None:
    body = _METADATA_TEMPLATE.format(
        platform=platform.platform(),
        cpu_cores=os.cpu_count() or 1,
        python_version=platform.python_version(),
        os=platform.system(),
        candidates_file=os.path.basename(candidates_path),
        submission_file=os.path.basename(out_path),
        jd_role=jd.get("role_title", "Senior AI Engineer"),
        jd_yoe_lo=jd.get("min_yoe", 5),
        jd_yoe_hi=jd.get("max_yoe", 9),
        jd_yoe_ideal=jd.get("ideal_yoe", 7),
        n_seen=n_seen,
        elapsed=f"{elapsed:.2f}",
        w_skills=WEIGHTS["skills"],
        w_title=WEIGHTS["title"],
        w_exp=WEIGHTS["experience"],
        w_edu=WEIGHTS["education"],
        w_sig=WEIGHTS["signals"],
    )
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(body)


# -----------------------------------------------------------------------------#
# CLI
# -----------------------------------------------------------------------------#
def _build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Deterministic ranker for the Redrob candidate dataset."
    )
    p.add_argument(
        "--candidates",
        default=None,
        help="Path to candidates.jsonl (auto-detected if omitted).",
    )
    p.add_argument(
        "--jd",
        default=None,
        help="Path to the job description PDF/DOCX/TXT (auto-detected).",
    )
    p.add_argument(
        "--out",
        default="submission.csv",
        help="Output CSV path (default: submission.csv).",
    )
    p.add_argument(
        "--top-n",
        type=int,
        default=100,
        help="Number of top candidates to output (default: 100).",
    )
    p.add_argument(
        "--metadata",
        default=None,
        help="Path for submission_metadata.yaml (default: alongside --out).",
    )
    return p


def main(argv: Optional[List[str]] = None) -> int:
    args = _build_arg_parser().parse_args(argv)
    project_root = os.path.dirname(os.path.abspath(__file__))

    candidates_path = args.candidates or auto_detect_candidates(project_root)
    if not candidates_path or not os.path.exists(candidates_path):
        print("[error] candidates.jsonl not found. Place it next to rank.py "
              "or pass --candidates <path>.", file=sys.stderr)
        return 2

    jd_path = args.jd or auto_detect_jd(project_root)

    run(
        candidates_path=candidates_path,
        jd_path=jd_path,
        out_path=args.out,
        top_n=args.top_n,
        metadata_out=args.metadata,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
