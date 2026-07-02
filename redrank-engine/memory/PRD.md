# PRD — Redrob Deterministic Candidate Ranking Engine

## Original problem statement
Build a production-ready deterministic ranking engine for the India Runs Data
& AI Challenge (Intelligent Candidate Discovery & Ranking). Stream a 100k
candidate JSONL, parse a Senior AI Engineer job description from
PDF/DOCX/TXT, compute a deterministic weighted score per candidate, and
output the top-100 as `submission.csv` (candidate_id, rank, score,
reasoning) with a filled `submission_metadata.yaml`. CPU-only, no LLMs at
inference, no network, memory-efficient.

## Architecture
Modular Python 3.9+ project (no framework):

| File | Responsibility |
|------|---------------|
| `rank.py` | CLI entry, streaming pipeline, bounded top-N min-heap, CSV + YAML writers |
| `parser.py` | Auto-detect + read JD (PDF via pypdf, DOCX via python-docx, TXT), regex-based extraction, fallback JD |
| `features.py` | Skills, career/title, experience, education, Redrob-signals, honeypot/consistency features |
| `scorer.py` | Fixed weights (skills 0.32 / title 0.22 / exp 0.14 / edu 0.06 / signals 0.26) + additive penalties + bounded multiplicative modifier |
| `reasoning.py` | Grounded, single-line reasoning composer (≤240 chars) — pulls facts from feature dict |
| `utils.py` | Vocabularies (core/strong/adjacent/negative skills + titles), streaming JSONL reader, deterministic math helpers |
| `validate_submission.py` | Standalone CSV validator (header, ranks, scores, reasoning) |
| `requirements.txt` | pypdf, python-docx, PyYAML |
| `README.md` | Setup, usage, methodology |

## Requirements met
- **Deterministic**: no randomness, fixed weights, `REFERENCE_TODAY = 2026-06-01`. Two runs produce byte-identical CSVs.
- **Streaming**: `stream_jsonl()` generator + bounded min-heap → constant memory ≈ 32 MB for 100k rows.
- **Performance**: 100k candidates scored in ~12.5 s wall-clock on 4-core container (~8 000 rows/s).
- **Explainable reasoning**: composed from real features only, varied templates, no repetition/hallucination.
- **Honeypot-aware**: penalises marketing-summary-vs-tech-title, keyword-stuffed skill lists, AI titles with 0 core skills, headline-YoE mismatches, employment gaps, job-hopping, staleness.
- **CSV compliance**: header exact, ranks contiguous 1..N, unique IDs, scores `\d\.\d{4}`, sorted DESC, no CRLF in reasoning.
- **Metadata YAML**: auto-populated compute/runtime block; team-identity fields kept as placeholders for the submitter to fill.
- **No external APIs / LLM inference**.

## User personas
- **Judges** running `python rank.py` against a fresh 100k candidates.jsonl expecting a valid submission.csv in < 5 min on CPU.
- **Hackathon team** iterating on scoring components; the modular split makes weights/features easy to tune.

## What's been implemented (2026-01, this session)
- Full 8-file modular project.
- Fallback JD hardcoded from the uploaded challenge PDF (Senior AI Engineer, 5-9 yrs).
- Standalone validator passing on the 50-candidate sample.
- Stress test at 100k candidates: 12.5s, 32 MB peak RSS.
- Fallback path (no JD file) verified.
- Determinism verified (two runs → identical CSV).

## Backlog / future
- **P1**: If the challenge organisers publish `validate_submission.py`, run it and reconcile.
- **P2**: Add unit tests for feature extractors (skill trust multiplier, honeypot detectors, tie-break stability).
- **P2**: Optional lightweight per-batch multiprocessing (mp.Pool over JSONL chunks) for even faster runs on the real dataset.
- **P2**: Ship a small `sanity_report.txt` with distribution stats (score histogram, bucket counts, honeypot hits).
- **P3**: Extract JD skills from richer PDF layouts (multi-column, tables) with a small optional layout parser.

## Next tasks
- User fills `submission_metadata.yaml` team fields.
- User runs `python rank.py` against the actual `candidates.jsonl`.
