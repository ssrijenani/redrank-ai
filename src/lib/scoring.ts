export type ScoreTone = "success" | "accent" | "warning" | "error";

export interface MatchTier {
  label: string;
  tone: ScoreTone;
}

/** Buckets an AI match score into a recruiter-legible tier — never show a bare number alone. */
export function getMatchTier(score: number): MatchTier {
  if (score >= 90) return { label: "Excellent Match", tone: "success" };
  if (score >= 75) return { label: "Strong Match", tone: "accent" };
  if (score >= 60) return { label: "Good Match", tone: "warning" };
  return { label: "Weak Match", tone: "error" };
}

export function getConfidenceLabel(score: number): string {
  if (score >= 90) return "Very High";
  if (score >= 75) return "High";
  if (score >= 60) return "Moderate";
  return "Low";
}

export function scoreTone(score: number): ScoreTone {
  if (score >= 90) return "success";
  if (score >= 75) return "accent";
  if (score >= 60) return "warning";
  return "error";
}
