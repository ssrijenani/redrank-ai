export interface ScoreBreakdown {
  axis: string;
  score: number; // 0-100
  maxScore: number;
}

export type CandidateDecision = "pending" | "approved" | "hold" | "rejected";

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  title: string;
  location: string;
  avatarInitials: string;
  /** Overall AI match, 0-100 — the headline "AI Match" score. */
  overallScore: number;
  skillMatch: number;
  experienceMatch: number;
  educationLevel: string;
  yearsOfExperience: number;
  /** Months of employment gap detected on the resume, 0 if none. */
  employmentGapMonths: number;
  /** Number of job changes in the last ~4 years — used for a "Frequent Job Changes" risk flag. */
  jobChangeCount: number;
  /** How ready this candidate appears for an interview, 0-100. */
  interviewReadiness: number;
  /** Where this application came from — used for Analytics' resume source distribution. */
  source: string;
  /** How well-structured/complete the resume itself is, 0-100. */
  resumeQuality: number;
  /** How confident the AI is in this candidate's score, 0-100 — distinct from the match score itself. */
  aiConfidence: number;
  /** Compact skill tags the candidate matched against the rubric — used for explainability chips. */
  matchedSkills: string[];
  /** Compact skill tags the candidate is missing against the rubric — used for explainability chips. */
  missingSkills: string[];
  scoreBreakdown: ScoreBreakdown[];
  strengths: string[];
  weaknesses: string[];
  interviewQuestions: string[];
  summary: string;
  decision: CandidateDecision;
  notes: string[];
  appliedAt: string;
}

/** Recruiter-facing label for each decision state, used consistently across Ranking and Decision Workspace. */
export const DECISION_LABELS: Record<CandidateDecision, string> = {
  pending: "Pending Review",
  approved: "Shortlisted",
  hold: "Needs Review",
  rejected: "Rejected",
};

export const DECISION_BADGE_TONE: Record<CandidateDecision, "neutral" | "success" | "warning" | "error"> = {
  pending: "neutral",
  approved: "success",
  hold: "warning",
  rejected: "error",
};
