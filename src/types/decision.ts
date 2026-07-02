export type DecisionAction = "approved" | "hold" | "rejected";

export type DecisionReason =
  | "Excellent Fit"
  | "Missing Skills"
  | "Experience Gap"
  | "Better Candidate"
  | "Budget"
  | "Other";

export const DECISION_REASONS: DecisionReason[] = [
  "Excellent Fit",
  "Missing Skills",
  "Experience Gap",
  "Better Candidate",
  "Budget",
  "Other",
];

export interface DecisionRecord {
  candidateId: string;
  action: DecisionAction;
  note?: string;
  decidedAt: string;
}

// ---------------------------------------------------------------------------
// Decision Workspace
// ---------------------------------------------------------------------------

export type RiskFlagSeverity = "low" | "medium" | "high";

export interface RiskFlag {
  label: string;
  severity: RiskFlagSeverity;
}

export type HiringRecommendationTier = "Strong Hire" | "Hire" | "Consider" | "No Hire";

export interface HiringRecommendation {
  tier: HiringRecommendationTier;
  confidence: number;
  reason: string;
}

export type InterviewPriority = "high" | "medium" | "low";

export interface InterviewAssignment {
  interviewer: string;
  date: string;
  priority: InterviewPriority;
}

export type ActivityEventType =
  | "resume_uploaded"
  | "ai_ranked"
  | "recruiter_viewed"
  | "interview_scheduled"
  | "decision_recorded";

export interface ActivityEvent {
  type: ActivityEventType;
  label: string;
  timestamp: string | null;
  completed: boolean;
}

export type AuditActor = "ai" | "recruiter";

export interface AuditLogEntry {
  actor: AuditActor;
  action: string;
  detail?: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface ScoreDistributionBucket {
  range: string;
  count: number;
}

export interface SkillHeatmapRow {
  skill: string;
  jobs: { jobTitle: string; coverage: number }[];
}

export interface DistributionBucket {
  label: string;
  count: number;
}

export interface RecruiterProductivity {
  avgReviewTimeHours: number;
  jobsInProgress: number;
  candidatesAwaitingReview: number;
  decisionsToday: number;
}

export interface AnalyticsFilters {
  jobId?: string;
  department?: string;
  recruiter?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AnalyticsSummary {
  totalJobs: number;
  totalCandidates: number;
  avgTimeToDecisionDays: number;
  avgAiMatch: number;
  approvalRate: number;
  hiringEfficiency: number;
  interviewRate: number;
  offerRate: number;
  funnel: FunnelStage[];
  scoreDistribution: ScoreDistributionBucket[];
  skillsHeatmap: SkillHeatmapRow[];
  resumeSourceDistribution: DistributionBucket[];
  experienceDistribution: DistributionBucket[];
  decisionDistribution: DistributionBucket[];
  recruiterProductivity: RecruiterProductivity;
  insights: string[];
}
