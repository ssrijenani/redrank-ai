"""
Standalone validator for submission.csv.

Checks:
  * header exactly candidate_id,rank,score,reasoning
  * N rows (default 100), ranks 1..N contiguous, unique
  * unique candidate_ids matching ^CAND_[0-9]{7}$
  * scores in [0.0000, 1.0000] with exactly 4 decimals, sorted DESC
  * reasoning present, single-line, <= 240 chars
Exit code 0 = pass, non-zero = fail.
"""
from __future__ import annotations

import csv
import re
import sys
from typing import List


def validate(path: str, expected_rows: int = 100) -> List[str]:
    errors: List[str] = []
    with open(path, "r", encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh)
        rows = list(reader)

    if not rows:
        return ["file empty"]

    header = rows[0]
    if header != ["candidate_id", "rank", "score", "reasoning"]:
        errors.append(f"bad header: {header}")

    data = rows[1:]
    if expected_rows and len(data) != expected_rows:
        errors.append(f"expected {expected_rows} rows, got {len(data)}")

    seen_ids: set = set()
    prev_score = None
    id_re = re.compile(r"^CAND_[0-9]{7}$")
    score_re = re.compile(r"^\d\.\d{4}$")
    for i, row in enumerate(data, start=1):
        if len(row) != 4:
            errors.append(f"row {i}: wrong number of columns ({len(row)})")
            continue
        cid, rank_s, score_s, reasoning = row
        if not id_re.match(cid):
            errors.append(f"row {i}: bad candidate_id '{cid}'")
        if cid in seen_ids:
            errors.append(f"row {i}: duplicate candidate_id '{cid}'")
        seen_ids.add(cid)
        try:
            rank = int(rank_s)
        except ValueError:
            errors.append(f"row {i}: non-int rank '{rank_s}'")
            continue
        if rank != i:
            errors.append(f"row {i}: rank should be {i}, got {rank}")
        if not score_re.match(score_s):
            errors.append(f"row {i}: score '{score_s}' not 4 decimals")
        else:
            score = float(score_s)
            if not (0.0 <= score <= 1.0):
                errors.append(f"row {i}: score out of range {score}")
            if prev_score is not None and score > prev_score + 1e-9:
                errors.append(f"row {i}: score {score} > previous {prev_score}, not sorted DESC")
            prev_score = score
        if not reasoning:
            errors.append(f"row {i}: empty reasoning")
        elif "\n" in reasoning or "\r" in reasoning:
            errors.append(f"row {i}: reasoning contains newline")
        elif len(reasoning) > 240:
            errors.append(f"row {i}: reasoning too long ({len(reasoning)} chars)")
    return errors


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "submission.csv"
    expected = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    errs = validate(path, expected)
    if errs:
        print(f"FAIL: {len(errs)} problem(s):")
        for e in errs:
            print("  -", e)
        sys.exit(1)
    print(f"OK: {path} passed all checks ({expected} rows)")
