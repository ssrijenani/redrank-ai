// ---------------------------------------------------------------------------
// Resume upload
// ---------------------------------------------------------------------------
export const MAX_UPLOAD_FILES = 25;
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export const SUPPORTED_FILE_EXTENSIONS = [".pdf", ".docx"] as const;

// ---------------------------------------------------------------------------
// Lists / pagination
// ---------------------------------------------------------------------------
export const DEFAULT_PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
/** Candidates at or above this overall AI score are flagged as strong matches. */
export const AI_SCORE_THRESHOLD = 75;

// ---------------------------------------------------------------------------
// Job Studio — job description editor
// ---------------------------------------------------------------------------
export const JD_MIN_LENGTH = 120;
export const JD_MAX_LENGTH = 6000;

// ---------------------------------------------------------------------------
// Job Studio — rubric weighting
// ---------------------------------------------------------------------------
/** Section weights should sum to this value; the UI warns (not blocks) otherwise. */
export const RUBRIC_TOTAL_WEIGHT = 100;

// ---------------------------------------------------------------------------
// Candidate Ranking
// ---------------------------------------------------------------------------
/** Minimum AI match score to be flagged as "Interview Recommended" on the ranking KPI row. */
export const INTERVIEW_RECOMMENDED_THRESHOLD = 85;
export const RANKING_SORT_OPTIONS = [
  { value: "aiMatch", label: "AI Match" },
  { value: "experience", label: "Experience" },
  { value: "recent", label: "Recently Uploaded" },
  { value: "name", label: "Name" },
] as const;
export type RankingSortOption = (typeof RANKING_SORT_OPTIONS)[number]["value"];
