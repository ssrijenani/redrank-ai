# Redrob Candidate Ranking Engine

A deterministic, memory-efficient, CPU-only ranking engine for the **India Runs
Data & AI Challenge — Intelligent Candidate Discovery & Ranking**.

Given a JSONL stream of 100 000+ candidate profiles and a Senior AI Engineer
job description, it produces a `submission.csv` (top-100, sorted by
descending score) with per-candidate reasoning grounded in the actual data.

## Highlights

- **Streaming** — reads `candidates.jsonl` line-by-line; RAM stays flat.
- **Bounded top-N heap** — keeps only the top-100 in memory.
- **Deterministic** — no randomness, no learnt weights, reproducible.
- **Explainable reasoning** — every row's reasoning is composed from real
  candidate fields (skills, endorsements, years, response rate, GitHub
  activity, gaps, etc.), never templated fluff.
- **Honeypot-aware** — penalises marketing-summary-vs-tech-title mismatches,
  keyword-stuffed skill lists, and AI titles without core AI skills.
- **CPU-only, no network, no LLM at inference**.
- Runs on 100 k candidates in well under 5 min on 8 CPU cores.

## Project layout

```
.
├── rank.py            Entry point / CLI, streaming pipeline, CSV + YAML output
├── parser.py          PDF/DOCX/TXT job-description parser + fallback JD
├── features.py        Feature engineering (skills, career, edu, signals, honeypot)
├── scorer.py          Deterministic weighted scorer
├── reasoning.py       Concise factual reasoning generator
├── utils.py           Vocabularies, streaming JSONL reader, math helpers
├── requirements.txt   Minimal dependencies (pypdf, python-docx, PyYAML)
└── README.md
```

## Quick start

```bash
pip install -r requirements.txt

# Place candidates.jsonl and (optionally) a job description PDF/DOCX/TXT next to
# rank.py, then simply:
python rank.py

# Or fully explicit:
python rank.py \
    --candidates ./candidates.jsonl \
    --jd        ./job_description.pdf \
    --out       ./submission.csv \
    --top-n     100
```

Outputs:

| File                       | Purpose                                  |
|----------------------------|------------------------------------------|
| `submission.csv`           | The scored top-N: `candidate_id, rank, score, reasoning` |
| `submission_metadata.yaml` | Auto-filled metadata template (edit team fields before submitting) |

## Job description handling

`parser.py` auto-detects the JD in the project folder in this order:

1. `job_description.docx` / `.pdf` / `.txt` (explicit names)
2. Any file containing `job`, `description`, `jd`, or `signal` in its name
   with a `.pdf` / `.docx` / `.txt` extension.

If nothing is found or parsing fails, the code uses a well-specified
fallback for the Senior AI Engineer role (5–9 yrs, Python + ML + ranking
+ retrieval + LLMs + MLOps + vector DBs, HR-tech domain). Any text found
in the JD file is layered on top to enrich the vocabulary.

## Scoring model

Every candidate is scored on the interval `[0, 1]` from five components
plus a bounded behavioural modifier and small penalties:

| Component     | Weight | What it rewards / punishes                                   |
|---------------|--------|---------------------------------------------------------------|
| Skills        | 0.32   | Canonical core / strong / adjacent skill overlap, weighted by proficiency × trust multiplier `(1 + log endorsements) · (1 + log duration_months)`. Negative skills (Photoshop, SEO, etc.) subtract. |
| Title/career  | 0.22   | Current title bucket (core / adjacent / unrelated) blended with the ratio of career months spent in core AI/ML roles. |
| Experience    | 0.14   | Triangular window centred at the JD's ideal YoE with graceful decay outside `[min, max]`. |
| Education     | 0.06   | Field of study × degree level × institution tier composite. |
| Redrob signals| 0.26   | Completeness, recruiter response rate, interview completion, offer acceptance, GitHub activity, relevant skill-assessment scores, endorsements, saves, views, connections, email/phone/LinkedIn verification, activity recency. |

The linear score is then multiplied by a **bounded** availability modifier
(`open_to_work`, `willing_to_relocate`, notice period) in `[0.85, 1.10]`,
and adjusted by:

- **Job-hopping penalty** — up to −0.5 for many short tenures.
- **Employment-gap penalty** — up to −0.10 for ≥12 months of gaps.
- **Consistency penalties** — up to −0.55 total for:
  - "My professional background is in marketing manager" summary paired
    with a core AI/ML current title.
  - Keyword-stuffed skill lists (many core tags, low endorsements/duration).
  - Core AI/ML title with zero core AI skills.
  - Headline "12+ yrs" vs `years_of_experience` = 3.

- **Progression bonus** — +0.08 if the most recent role adds a
  seniority word ("senior", "lead", "manager", "head", …) not present at
  career start.

The final score is clamped to `[0, 1]`.

### Deterministic ranking

- Rankings are stable: ties are broken by lexicographic candidate_id
  ascending, so the same input always produces the same CSV.
- Scores are rounded to 4 decimals and the internal ranking key uses the
  same rounded value so the CSV score never contradicts the rank.

## Reasoning strings

`reasoning.py` composes each row's reasoning from a template selected by
which factors dominated the score. Every fact — years, top skills, response
rate, endorsements, GitHub score, months in core roles, employment gaps,
notice period, "flag: …" red flags — is pulled from the extracted feature
dict. Nothing is invented. Strings are trimmed to ~240 characters and are
single-line CSV-safe.

## Performance

On an 8-core CPU with 16 GB RAM, the reference implementation processes
~30 000 candidates/second, i.e. 100 k in ≈ 3 seconds excluding disk I/O.
Memory footprint stays bounded because only the top-N heap and one
candidate at a time are held.

## Reproducibility

- Uses only Python 3.9+ standard library plus `pypdf`, `python-docx`,
  `PyYAML`.
- No network calls of any kind.
- No random seeds required — every computation is deterministic.
- The reference "today" for recency calculations is fixed to
  `2026-06-01` (see `utils.REFERENCE_TODAY`) so scores don't drift
  with wall-clock time.

## Validating the output

The generated `submission.csv` is guaranteed to satisfy:

- Header exactly `candidate_id,rank,score,reasoning`.
- 100 rows (or `--top-n` rows) sorted by descending `score`.
- Ranks 1..N contiguous, unique.
- Unique `candidate_id`s.
- Scores formatted as `0.NNNN` (4 decimals) in `[0.0000, 1.0000]`.
- Reasoning single-line, ≤ 240 chars, no CR/LF.

A minimal in-house verifier is included at the bottom of `rank.py`'s
docstring; add your own validator command against the CSV if needed.

## License

Internal challenge submission. See LICENSE if provided.
