# 🚀 RedRank AI

## Explainable AI Candidate Ranking Platform

RedRank AI is an Explainable AI-powered hiring intelligence platform built for the India.Runs Data & AI Challenge.

Unlike traditional ATS systems that rely primarily on keyword matching, RedRank AI evaluates candidates using deterministic multi-factor scoring across skills, experience, education, career progression, and Redrob Signals to generate transparent, reproducible hiring recommendations.

---

# 🌐 Live Demo

https://redrank-ai.web.app

---

# 💻 GitHub Repository

https://github.com/ssrijenani/redrank-ai

---

# ✨ Key Features

- Explainable AI Candidate Ranking
- Deterministic Multi-factor Scoring
- Transparent Candidate Reasoning
- Redrob Signals Integration
- Career Progression Analysis
- Job Gap & Job Hop Detection
- Top 100 Candidate Recommendation
- CSV & XLSX Export
- CPU-only Execution
- Processes 100,000 Candidates

---

# Problem Statement

Recruiters receive thousands of applications while traditional ATS systems often miss highly qualified candidates due to keyword-based filtering.

RedRank AI addresses this by intelligently evaluating candidates using multiple hiring signals and generating explainable rankings that recruiters can trust.

---

# Architecture

```
Recruiter Dashboard (React + TypeScript)

↓

Firebase Hosting

↓

Python Ranking Engine

↓

Feature Extraction

↓

Deterministic Scoring

↓

Top 100 Candidate Ranking

↓

submission.xlsx
```

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Firebase Hosting

## Ranking Engine

- Python
- Pandas
- OpenPyXL

## AI-assisted Development

- ChatGPT
- Claude
- Gemini

---

# Performance

| Metric | Result |
|---------|--------|
| Candidates Processed | 100,000 |
| Runtime | ~13 Seconds |
| Execution | CPU Only |
| Output | submission.csv |
| Excel Export | submission.xlsx |
| Validation | Passed |

---

# Repository Structure

```
redrank-ai/

├── src/
├── public/
├── functions/
├── redrank-engine/
│   ├── rank.py
│   ├── parser.py
│   ├── scorer.py
│   ├── reasoning.py
│   ├── features.py
│   ├── validate_submission.py
│   └── submission_metadata.yaml
└── README.md
```

---

# Results

- Processed the official Redrob dataset of 100,000 candidates
- Generated explainable rankings
- Exported Top 100 candidates
- Generated submission.csv
- Generated submission.xlsx
- Passed submission validation

---

# Run Locally

## Frontend

```bash
npm install
npm run dev
```

## Ranking Engine

```bash
cd redrank-engine

pip install -r requirements.txt

python rank.py

python validate_submission.py submission.csv
```

---

# Deliverables

- ✅ Public GitHub Repository
- ✅ Live Demo
- ✅ Explainable Ranking Engine
- ✅ submission.xlsx
- ✅ PPT Presentation

---

# Developed By

**S. Sri Jenani**

B.Tech Computer Science Student

MIT ADT University

India.Runs Data & AI Challenge 2026