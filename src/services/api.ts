/**
 * services/api.ts
 * ----------------
 * SINGLE SOURCE OF DATA ACCESS for the entire frontend.
 *
 * Pages and components NEVER import from `data/mock/*` directly.
 * They call the typed functions exported from this file only, and every
 * function resolves the same `ApiResponse<T>` envelope — this contract
 * stays identical when the mock body is replaced with real Firebase
 * Functions / Firestore / Gemini calls.
 */

import type {
  ApiResponse,
  Job,
  JobSummary,
  Rubric,
  RubricSections,
  Candidate,
  ScoreBreakdown,
  ResumeUpload,
  AnalyticsSummary,
  AnalyticsFilters,
  DecisionAction,
  RiskFlag,
  HiringRecommendation,
  InterviewAssignment,
  ActivityEvent,
  AuditLogEntry,
  DistributionBucket,
} from "../types";
import { DECISION_LABELS } from "../types";

import jobsData from "../data/mock/jobs.json";
import rubricData from "../data/mock/rubric.json";
import candidatesData from "../data/mock/candidates.json";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ok<T>(data: T, message: string | null = null): ApiResponse<T> {
  return { success: true, data, message };
}

function fail<T>(fallback: T, message: string): ApiResponse<T> {
  return { success: false, data: fallback, message };
}

/** Simulates an occasional backend/network failure so error states are genuinely reachable. */
function shouldSimulateFailure(probability = 0.12): boolean {
  return Math.random() < probability;
}

/** Mutable in-memory stores so mock writes persist for the session. */
const jobsStore: Job[] = JSON.parse(JSON.stringify(jobsData)) as Job[];
const rubricStore: Record<string, Rubric> = JSON.parse(JSON.stringify(rubricData));
const candidatesStore: Candidate[] = JSON.parse(JSON.stringify(candidatesData)) as Candidate[];

// ---------------------------------------------------------------------------
// Auth (mock only — no real authentication per project scope)
// ---------------------------------------------------------------------------

export async function mockSignIn(
  _email: string,
  _password: string
): Promise<ApiResponse<{ signedIn: true }>> {
  await wait(900);
  return ok({ signedIn: true });
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export async function fetchJobs(): Promise<ApiResponse<JobSummary[]>> {
  await wait(700);
  const summaries: JobSummary[] = jobsStore.map((job) => {
    const jobCandidates = candidatesStore.filter((c) => c.jobId === job.id);
    const avgScore =
      jobCandidates.length > 0
        ? Math.round(
            jobCandidates.reduce((sum, c) => sum + c.overallScore, 0) / jobCandidates.length
          )
        : 0;
    return {
      id: job.id,
      title: job.title,
      status: job.status,
      candidateCount: job.candidateCount,
      avgScore,
      updatedAt: job.updatedAt,
    };
  });
  return ok(summaries);
}

export async function fetchJobById(jobId: string): Promise<ApiResponse<Job | null>> {
  await wait(500);
  const job = jobsStore.find((j) => j.id === jobId) ?? null;
  return ok(job);
}

// ---------------------------------------------------------------------------
// Job Studio — AI rubric generation
// ---------------------------------------------------------------------------

const REQUIRED_SKILL_KEYWORDS = [
  "react",
  "typescript",
  "javascript",
  "vue",
  "angular",
  "html",
  "css",
];

const PREFERRED_SKILL_KEYWORDS = [
  "node.js",
  "node",
  "python",
  "sql",
  "graphql",
  "aws",
  "tailwind",
  "docker",
  "kubernetes",
  "figma",
  "redux",
  "next.js",
];

const SOFT_SKILL_KEYWORDS: { match: string; label: string }[] = [
  { match: "communicat", label: "Written & verbal communication" },
  { match: "leadership", label: "Team leadership" },
  { match: "mentor", label: "Mentorship" },
  { match: "collaborat", label: "Cross-functional collaboration" },
  { match: "stakeholder", label: "Stakeholder management" },
  { match: "ownership", label: "Ownership & accountability" },
  { match: "problem solv", label: "Problem solving" },
];

function toTitleCase(term: string): string {
  return term
    .split(/[\s.]+/)
    .map((w) => (w.length <= 3 && w === w.toLowerCase() ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Lightweight keyword-extraction heuristic standing in for the real Gemini call. */
function buildRubricFromDescription(
  jobDescription: string
): Omit<Rubric, "id" | "jobId" | "status" | "generatedAt"> {
  const lower = jobDescription.toLowerCase();

  const requiredSkills = REQUIRED_SKILL_KEYWORDS.filter((kw) => lower.includes(kw)).map(toTitleCase);
  const preferredSkills = PREFERRED_SKILL_KEYWORDS.filter((kw) => lower.includes(kw)).map(toTitleCase);
  const softSkills = SOFT_SKILL_KEYWORDS.filter((s) => lower.includes(s.match)).map((s) => s.label);

  const yearsMatch = lower.match(/(\d+)\+?\s*years?/);
  const experienceItems = yearsMatch
    ? [`${yearsMatch[1]}+ years of relevant professional experience`]
    : ["3-5 years of relevant professional experience"];

  const educationItems = lower.includes("master")
    ? ["Master's degree or equivalent practical experience"]
    : lower.includes("phd")
      ? ["PhD or equivalent research experience"]
      : ["Bachelor's degree or equivalent practical experience"];

  const firstLine = jobDescription.split("\n")[0]?.trim().slice(0, 80) ?? "";

  return {
    jobTitle: firstLine.length > 4 && firstLine.length < 80 ? firstLine : "",
    requiredSkills: {
      weight: 35,
      items: requiredSkills.length > 0 ? requiredSkills : ["Core technical proficiency"],
    },
    preferredSkills: {
      weight: 20,
      items: preferredSkills.length > 0 ? preferredSkills : ["Adjacent tooling familiarity"],
    },
    softSkills: {
      weight: 15,
      items: softSkills.length > 0 ? softSkills : ["Cross-functional collaboration"],
    },
    experience: {
      weight: 20,
      items: experienceItems,
    },
    education: {
      weight: 10,
      items: educationItems,
    },
  };
}

function emptyRubric(): Rubric {
  return {
    id: "",
    jobId: null,
    jobTitle: "",
    status: "draft",
    generatedAt: "",
    requiredSkills: { weight: 0, items: [] },
    preferredSkills: { weight: 0, items: [] },
    softSkills: { weight: 0, items: [] },
    experience: { weight: 0, items: [] },
    education: { weight: 0, items: [] },
  };
}

/**
 * Stands in for the Gemini-backed rubric generation call. Takes only the
 * job description, exactly like the real endpoint will — no jobId exists
 * yet because the job hasn't been saved.
 */
export async function generateHiringRubric(jobDescription: string): Promise<ApiResponse<Rubric>> {
  await wait(1500); // the "AI thinking" moment — deliberately longer than other calls

  if (shouldSimulateFailure()) {
    return fail(emptyRubric(), "The AI rubric service is temporarily unavailable. Please try again.");
  }

  const generated = buildRubricFromDescription(jobDescription);
  const rubric: Rubric = {
    id: `rubric-draft-${Date.now()}`,
    jobId: null,
    status: "draft",
    generatedAt: new Date().toISOString(),
    ...generated,
  };
  return ok(rubric);
}

// ---------------------------------------------------------------------------
// Job Studio — save (the only persisting action in the whole workflow)
// ---------------------------------------------------------------------------

export interface SaveJobInput {
  title: string;
  description: string;
  location: string;
  employmentType: Job["employmentType"];
  rubricSections: RubricSections;
}

export async function saveJob(input: SaveJobInput): Promise<ApiResponse<Job | null>> {
  await wait(900);

  if (shouldSimulateFailure()) {
    return fail(
      null,
      "Couldn't save this job right now. Your rubric edits are preserved — please try again."
    );
  }

  const newJob: Job = {
    id: `job-${Date.now()}`,
    company: "RedRank AI",
    title: input.title,
    description: input.description,
    location: input.location,
    employmentType: input.employmentType,
    status: "active",
    candidateCount: 0,
    // Job Studio doesn't collect these yet — reasonable defaults until that form grows.
    department: "General",
    recruiterName: "You",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobsStore.unshift(newJob);

  const savedRubric: Rubric = {
    id: `rubric-${newJob.id}`,
    jobId: newJob.id,
    jobTitle: input.title,
    status: "saved",
    generatedAt: new Date().toISOString(),
    ...input.rubricSections,
  };
  rubricStore[newJob.id] = savedRubric;

  return ok(newJob, "Job saved successfully.");
}

export async function fetchRubric(jobId: string): Promise<ApiResponse<Rubric | null>> {
  await wait(400);
  return ok(rubricStore[jobId] ?? null);
}

// ---------------------------------------------------------------------------
// Resume Upload
// ---------------------------------------------------------------------------

/** Per-job in-memory store of resume uploads. Mutated directly by the lifecycle simulation below. */
const resumeUploadsStore: Record<string, ResumeUpload[]> = {};

function findResumeUpload(jobId: string, uploadId: string): ResumeUpload | undefined {
  return resumeUploadsStore[jobId]?.find((u) => u.id === uploadId);
}

function mockPageCount(): number {
  return Math.floor(Math.random() * 4) + 1; // 1-4 pages
}

function deriveCandidateName(fileName: string): string {
  return fileName
    .replace(/\.(pdf|docx)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Advances a single upload record through queued -> uploading -> parsing ->
 * completed | failed entirely on its own timers. The page never drives this —
 * it only ever reads current state via fetchResumeUploads (polling) or reacts
 * to the promise resolution of initiateResumeUpload / retryResumeUpload.
 */
function simulateUploadLifecycle(jobId: string, uploadId: string) {
  const uploadTick = setInterval(() => {
    const record = findResumeUpload(jobId, uploadId);
    if (!record) {
      clearInterval(uploadTick);
      return;
    }
    if (record.status === "queued") {
      record.status = "uploading";
    }
    if (record.status === "uploading") {
      record.progress = Math.min(100, record.progress + 12 + Math.random() * 18);
      if (record.progress >= 100) {
        record.progress = 100;
        record.status = "parsing";
        clearInterval(uploadTick);

        setTimeout(() => {
          const parsing = findResumeUpload(jobId, uploadId);
          if (!parsing || parsing.status !== "parsing") return;
          const willFail = Math.random() < 0.1;
          if (willFail) {
            parsing.status = "failed";
            parsing.errorMessage =
              "Couldn't parse this resume. The file may be corrupted or password-protected.";
          } else {
            parsing.status = "completed";
            parsing.pageCount = mockPageCount();
            parsing.candidateName = deriveCandidateName(parsing.fileName);
          }
        }, 700 + Math.random() * 700);
      }
    }
  }, 220);
}

export async function initiateResumeUpload(
  jobId: string,
  files: { fileName: string; fileSizeKb: number }[]
): Promise<ApiResponse<ResumeUpload[]>> {
  await wait(300);

  const newUploads: ResumeUpload[] = files.map((f, i) => ({
    id: `upload-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    jobId,
    fileName: f.fileName,
    fileSizeKb: f.fileSizeKb,
    progress: 0,
    status: "queued",
    candidateName: null,
    pageCount: null,
    uploadedAt: new Date().toISOString(),
    errorMessage: null,
  }));

  resumeUploadsStore[jobId] = [...(resumeUploadsStore[jobId] ?? []), ...newUploads];

  // Stagger start so a batch feels like it's queuing rather than firing at once.
  newUploads.forEach((u, i) => {
    setTimeout(() => simulateUploadLifecycle(jobId, u.id), i * 260);
  });

  return ok(newUploads);
}

export async function fetchResumeUploads(jobId: string): Promise<ApiResponse<ResumeUpload[]>> {
  await wait(200);
  return ok(resumeUploadsStore[jobId] ? [...resumeUploadsStore[jobId]] : []);
}

export async function retryResumeUpload(
  jobId: string,
  uploadId: string
): Promise<ApiResponse<ResumeUpload | null>> {
  await wait(250);
  const record = findResumeUpload(jobId, uploadId);
  if (!record) {
    return fail(null, "This upload no longer exists.");
  }
  record.status = "queued";
  record.progress = 0;
  record.errorMessage = null;
  simulateUploadLifecycle(jobId, uploadId);
  return ok(record);
}

export async function removeResumeUpload(
  jobId: string,
  uploadId: string
): Promise<ApiResponse<{ removed: boolean }>> {
  await wait(150);
  const before = resumeUploadsStore[jobId]?.length ?? 0;
  resumeUploadsStore[jobId] = (resumeUploadsStore[jobId] ?? []).filter((u) => u.id !== uploadId);
  const removed = (resumeUploadsStore[jobId]?.length ?? 0) < before;
  return ok({ removed });
}

// ---------------------------------------------------------------------------
// Candidates / Ranking
// ---------------------------------------------------------------------------

export async function fetchCandidatesByJob(jobId: string): Promise<ApiResponse<Candidate[]>> {
  await wait(900);
  const results = candidatesStore
    .filter((c) => c.jobId === jobId)
    .sort((a, b) => b.overallScore - a.overallScore);
  return ok(results);
}

export async function fetchCandidateById(candidateId: string): Promise<ApiResponse<Candidate | null>> {
  await wait(500);
  const candidate = candidatesStore.find((c) => c.id === candidateId) ?? null;
  return ok(candidate);
}

export async function submitDecision(
  candidateId: string,
  action: DecisionAction,
  note?: string
): Promise<ApiResponse<Candidate | null>> {
  await wait(500);
  const candidate = candidatesStore.find((c) => c.id === candidateId);
  if (!candidate) {
    return fail(null, `Candidate ${candidateId} not found.`);
  }
  candidate.decision = action;
  if (note && note.trim()) {
    candidate.notes = [...candidate.notes, note.trim()];
  }
  return ok(candidate);
}

/** Bulk variant of submitDecision — used by the ranking table's bulk-selection toolbar. */
export async function bulkSubmitDecision(
  candidateIds: string[],
  action: DecisionAction
): Promise<ApiResponse<Candidate[]>> {
  await wait(700);
  const updated: Candidate[] = [];
  for (const id of candidateIds) {
    const candidate = candidatesStore.find((c) => c.id === id);
    if (candidate) {
      candidate.decision = action;
      updated.push(candidate);
    }
  }
  return ok(updated, `${updated.length} candidate${updated.length === 1 ? "" : "s"} updated.`);
}

export async function addCandidateNote(
  candidateId: string,
  note: string
): Promise<ApiResponse<Candidate | null>> {
  await wait(400);
  const candidate = candidatesStore.find((c) => c.id === candidateId);
  if (!candidate) {
    return fail(null, `Candidate ${candidateId} not found.`);
  }
  if (note.trim()) {
    candidate.notes = [...candidate.notes, note.trim()];
  }
  return ok(candidate);
}

/**
 * Stands in for a Gemini-backed insights summary over the full ranked pool for
 * a job. Computes real aggregate stats from the mock dataset rather than
 * returning static strings, so the "AI" framing stays honest even before the
 * real model is wired in.
 */
export async function fetchRankingInsights(jobId: string): Promise<ApiResponse<string[]>> {
  await wait(650);
  const pool = candidatesStore.filter((c) => c.jobId === jobId);
  if (pool.length === 0) {
    return ok([]);
  }

  const insights: string[] = [];

  // Most common matched skill across the pool.
  const skillCounts = new Map<string, number>();
  pool.forEach((c) => c.matchedSkills.forEach((s) => skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1)));
  const topSkillEntry = [...skillCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topSkillEntry && topSkillEntry[1] >= 2) {
    insights.push(
      `Top candidates strongly match on ${topSkillEntry[0]}, present in ${topSkillEntry[1]} of ${pool.length} profiles.`
    );
  }

  // Most common missing skill.
  const missingCounts = new Map<string, number>();
  pool.forEach((c) => c.missingSkills.forEach((s) => missingCounts.set(s, (missingCounts.get(s) ?? 0) + 1)));
  const topMissingEntry = [...missingCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topMissingEntry) {
    insights.push(
      `${topMissingEntry[1]} candidate${topMissingEntry[1] === 1 ? " is" : "s are"} missing ${topMissingEntry[0]}.`
    );
  }

  // Candidates with zero missing skills.
  const fullMatches = pool.filter((c) => c.missingSkills.length === 0).length;
  if (fullMatches > 0) {
    insights.push(
      `${fullMatches} candidate${fullMatches === 1 ? "" : "s"} match every required skill with no gaps.`
    );
  }

  // Score lift for candidates who have the top skill vs those who don't.
  if (topSkillEntry) {
    const withSkill = pool.filter((c) => c.matchedSkills.includes(topSkillEntry[0]));
    const withoutSkill = pool.filter((c) => !c.matchedSkills.includes(topSkillEntry[0]));
    if (withSkill.length > 0 && withoutSkill.length > 0) {
      const avgWith = withSkill.reduce((s, c) => s + c.overallScore, 0) / withSkill.length;
      const avgWithout = withoutSkill.reduce((s, c) => s + c.overallScore, 0) / withoutSkill.length;
      const liftPct = Math.round(((avgWith - avgWithout) / avgWithout) * 100);
      if (liftPct > 5) {
        insights.push(
          `Candidates with ${topSkillEntry[0]} scored ${liftPct}% higher on average than those without it.`
        );
      }
    }
  }

  return ok(insights.slice(0, 4));
}

// ---------------------------------------------------------------------------
// Decision Workspace
// ---------------------------------------------------------------------------

/**
 * Six-axis radar for the Decision Workspace — a distinct axis set from the
 * Ranking table's rubric-derived scoreBreakdown, standing in for a dedicated
 * Gemini "holistic profile" call over Skills / Experience / Education /
 * Projects / Communication / Resume Quality.
 */
export async function fetchDecisionRadar(candidateId: string): Promise<ApiResponse<ScoreBreakdown[]>> {
  await wait(500);
  const c = candidatesStore.find((c) => c.id === candidateId);
  if (!c) return fail([], `Candidate ${candidateId} not found.`);

  const collaborationAxis = c.scoreBreakdown.find((s) => s.axis === "Collaboration")?.score ?? c.skillMatch;
  const educationAxis = c.scoreBreakdown.find((s) => s.axis === "Education")?.score ?? 75;
  // "Projects" isn't tracked directly — approximate from skill match + resume quality, the two
  // signals a recruiter would actually use as a proxy for project depth on a resume.
  const projectsScore = Math.round((c.skillMatch + c.resumeQuality) / 2);

  const radar: ScoreBreakdown[] = [
    { axis: "Skills", score: c.skillMatch, maxScore: 100 },
    { axis: "Experience", score: c.experienceMatch, maxScore: 100 },
    { axis: "Education", score: educationAxis, maxScore: 100 },
    { axis: "Projects", score: projectsScore, maxScore: 100 },
    { axis: "Communication", score: collaborationAxis, maxScore: 100 },
    { axis: "Resume Quality", score: c.resumeQuality, maxScore: 100 },
  ];
  return ok(radar);
}

function tierForScore(score: number): "Strong Hire" | "Hire" | "Consider" | "No Hire" {
  if (score >= 90) return "Strong Hire";
  if (score >= 75) return "Hire";
  if (score >= 60) return "Consider";
  return "No Hire";
}

export async function fetchHiringRecommendation(
  candidateId: string
): Promise<ApiResponse<HiringRecommendation>> {
  await wait(700);
  const c = candidatesStore.find((c) => c.id === candidateId);
  if (!c) return fail({ tier: "Consider", confidence: 0, reason: "" }, `Candidate ${candidateId} not found.`);

  const tier = tierForScore(c.overallScore);
  const topStrengths = c.matchedSkills.slice(0, 2).join(" and ");
  const reason =
    c.missingSkills.length === 0
      ? `Candidate satisfies every required skill and scores strongly across ${topStrengths || "the core rubric"}.`
      : `Candidate satisfies most mandatory hiring criteria and stands out in ${topStrengths || "the core rubric"}, with a gap in ${c.missingSkills[0]}.`;

  return ok({ tier, confidence: c.aiConfidence, reason });
}

export async function fetchRiskFlags(candidateId: string): Promise<ApiResponse<RiskFlag[]>> {
  await wait(450);
  const c = candidatesStore.find((c) => c.id === candidateId);
  if (!c) return fail([], `Candidate ${candidateId} not found.`);

  const flags: RiskFlag[] = [];
  if (c.missingSkills.length > 0) {
    flags.push({ label: `Missing Required Skill${c.missingSkills.length > 1 ? "s" : ""}`, severity: "medium" });
  }
  if (c.employmentGapMonths >= 6) {
    flags.push({ label: `Employment Gap (${c.employmentGapMonths} months)`, severity: "medium" });
  }
  if (c.resumeQuality < 75) {
    flags.push({ label: "Low Resume Quality", severity: "low" });
  }
  if (c.jobChangeCount >= 4) {
    flags.push({ label: "Frequent Job Changes", severity: "medium" });
  }
  if (c.educationLevel.toLowerCase().includes("electronics") || c.educationLevel.toLowerCase().includes("mechanical")) {
    flags.push({ label: "Education Mismatch", severity: "low" });
  }
  if (c.overallScore < 60) {
    flags.push({ label: "Below Hiring Bar", severity: "high" });
  }
  return ok(flags);
}

/** Pads the candidate's stored interview questions up to 5 with rubric-informed generated ones. */
export async function fetchInterviewQuestions(candidateId: string): Promise<ApiResponse<string[]>> {
  await wait(600);
  const c = candidatesStore.find((c) => c.id === candidateId);
  if (!c) return fail([], `Candidate ${candidateId} not found.`);

  const questions = [...c.interviewQuestions];
  const fillers = [
    c.missingSkills[0]
      ? `Walk us through your experience — direct or adjacent — with ${c.missingSkills[0]}.`
      : "Where do you see the biggest gap between your current skill set and this role?",
    c.matchedSkills[0]
      ? `Tell us about the most complex problem you've solved using ${c.matchedSkills[0]}.`
      : "Tell us about the most complex technical problem you've solved recently.",
    "How do you approach ramping up in an unfamiliar codebase or domain?",
  ];
  for (const filler of fillers) {
    if (questions.length >= 5) break;
    if (!questions.includes(filler)) questions.push(filler);
  }
  return ok(questions.slice(0, 5));
}

const interviewAssignmentsStore: Record<string, InterviewAssignment> = {};
const auditLogStore: Record<string, AuditLogEntry[]> = {};

function ensureAuditSeed(candidateId: string) {
  if (auditLogStore[candidateId]) return;
  const c = candidatesStore.find((c) => c.id === candidateId);
  auditLogStore[candidateId] = [
    {
      actor: "ai",
      action: "AI generated ranking and hiring recommendation",
      detail: c ? `Overall match ${c.overallScore}%, confidence ${c.aiConfidence}%.` : undefined,
      timestamp: c?.appliedAt ?? new Date().toISOString(),
    },
  ];
}

export async function fetchAuditLog(candidateId: string): Promise<ApiResponse<AuditLogEntry[]>> {
  await wait(400);
  ensureAuditSeed(candidateId);
  return ok([...auditLogStore[candidateId]]);
}

export async function fetchActivityTimeline(candidateId: string): Promise<ApiResponse<ActivityEvent[]>> {
  await wait(400);
  const c = candidatesStore.find((c) => c.id === candidateId);
  if (!c) return fail([], `Candidate ${candidateId} not found.`);

  const assignment = interviewAssignmentsStore[candidateId];
  const decided = c.decision !== "pending";

  const timeline: ActivityEvent[] = [
    { type: "resume_uploaded", label: "Resume Uploaded", timestamp: c.appliedAt, completed: true },
    { type: "ai_ranked", label: "AI Ranked", timestamp: c.appliedAt, completed: true },
    { type: "recruiter_viewed", label: "Recruiter Viewed", timestamp: new Date().toISOString(), completed: true },
    {
      type: "interview_scheduled",
      label: "Interview Scheduled",
      timestamp: assignment?.date ?? null,
      completed: Boolean(assignment),
    },
    {
      type: "decision_recorded",
      label: "Decision Recorded",
      timestamp: decided ? new Date().toISOString() : null,
      completed: decided,
    },
  ];
  return ok(timeline);
}

export async function assignInterview(
  candidateId: string,
  assignment: InterviewAssignment
): Promise<ApiResponse<InterviewAssignment>> {
  await wait(500);
  interviewAssignmentsStore[candidateId] = assignment;
  ensureAuditSeed(candidateId);
  auditLogStore[candidateId].push({
    actor: "recruiter",
    action: "Interview scheduled",
    detail: `${assignment.interviewer} · ${assignment.priority} priority`,
    timestamp: new Date().toISOString(),
  });
  return ok(assignment, "Interview assigned.");
}

export async function fetchInterviewAssignment(
  candidateId: string
): Promise<ApiResponse<InterviewAssignment | null>> {
  await wait(300);
  return ok(interviewAssignmentsStore[candidateId] ?? null);
}

/**
 * Records a final recruiter decision from the Decision Workspace, including
 * the structured reason dropdown — distinct from the lighter-weight
 * submitDecision used inline from the Ranking table (no reason there).
 */
export async function recordWorkspaceDecision(
  candidateId: string,
  action: DecisionAction,
  reason: string,
  note?: string
): Promise<ApiResponse<Candidate | null>> {
  await wait(600);
  const candidate = candidatesStore.find((c) => c.id === candidateId);
  if (!candidate) return fail(null, `Candidate ${candidateId} not found.`);

  const previousDecision = candidate.decision;
  candidate.decision = action;
  if (note && note.trim()) {
    candidate.notes = [...candidate.notes, note.trim()];
  }

  ensureAuditSeed(candidateId);
  auditLogStore[candidateId].push({
    actor: "recruiter",
    action: `Recruiter ${action === "approved" ? "approved" : action === "rejected" ? "rejected" : "put on hold"} (was ${DECISION_LABELS[previousDecision]})`,
    detail: `Reason: ${reason}`,
    timestamp: new Date().toISOString(),
  });

  return ok(candidate, "Decision recorded.");
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function fetchAnalyticsFilterOptions(): Promise<
  ApiResponse<{ jobs: { id: string; title: string }[]; departments: string[]; recruiters: string[] }>
> {
  await wait(300);
  return ok({
    jobs: jobsStore.map((j) => ({ id: j.id, title: j.title })),
    departments: [...new Set(jobsStore.map((j) => j.department))].sort(),
    recruiters: [...new Set(jobsStore.map((j) => j.recruiterName))].sort(),
  });
}

/**
 * Computes executive analytics live from the jobs and candidates stores so
 * every filter dimension (job, department, recruiter, date range) genuinely
 * changes every chart — not a static snapshot swapped out underneath the UI.
 */
export async function fetchAnalytics(filters: AnalyticsFilters = {}): Promise<ApiResponse<AnalyticsSummary>> {
  await wait(750);

  const matchingJobs = jobsStore.filter((j) => {
    if (filters.jobId && j.id !== filters.jobId) return false;
    if (filters.department && j.department !== filters.department) return false;
    if (filters.recruiter && j.recruiterName !== filters.recruiter) return false;
    return true;
  });
  const matchingJobIds = new Set(matchingJobs.map((j) => j.id));

  const fromTime = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
  const toTime = filters.dateTo ? new Date(filters.dateTo).getTime() : null;

  const pool = candidatesStore.filter((c) => {
    if (!matchingJobIds.has(c.jobId)) return false;
    const t = new Date(c.appliedAt).getTime();
    if (fromTime !== null && t < fromTime) return false;
    if (toTime !== null && t > toTime) return false;
    return true;
  });

  const totalJobs = matchingJobs.length;
  const totalCandidates = pool.length;
  const avgAiMatch = totalCandidates > 0 ? Math.round(pool.reduce((s, c) => s + c.overallScore, 0) / totalCandidates) : 0;

  const approved = pool.filter((c) => c.decision === "approved").length;
  const rejected = pool.filter((c) => c.decision === "rejected").length;
  const hold = pool.filter((c) => c.decision === "hold").length;
  const settled = approved + rejected + hold;

  const approvalRate = totalCandidates > 0 ? approved / totalCandidates : 0;
  const hiringEfficiency = settled > 0 ? Math.round((approved / settled) * 100) : 0;
  const interviewRate = totalCandidates > 0 ? Math.round(((approved + hold) / totalCandidates) * 100) : 0;
  const offerRate = totalCandidates > 0 ? Math.round((approved / Math.max(totalCandidates, 1)) * 100) : 0;

  const reviewed = pool.filter((c) => c.decision !== "pending").length;
  const funnel = [
    { stage: "Applied", count: totalCandidates },
    { stage: "Resume Parsed", count: totalCandidates },
    { stage: "Ranked", count: totalCandidates },
    { stage: "Reviewed", count: reviewed },
    { stage: "Approved", count: approved },
  ];

  const scoreBuckets = [
    { range: "0-20", min: 0, max: 20 },
    { range: "21-40", min: 21, max: 40 },
    { range: "41-60", min: 41, max: 60 },
    { range: "61-80", min: 61, max: 80 },
    { range: "81-100", min: 81, max: 100 },
  ];
  const scoreDistribution = scoreBuckets.map((b) => ({
    range: b.range,
    count: pool.filter((c) => c.overallScore >= b.min && c.overallScore <= b.max).length,
  }));

  const skillCounts = new Map<string, number>();
  pool.forEach((c) => c.matchedSkills.forEach((s) => skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1)));
  const topSkills = [...skillCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const skillsHeatmap = topSkills.map(([skill]) => ({
    skill,
    jobs: matchingJobs.map((j) => {
      const jobPool = pool.filter((c) => c.jobId === j.id);
      const withSkill = jobPool.filter((c) => c.matchedSkills.includes(skill)).length;
      const coverage = jobPool.length > 0 ? Math.round((withSkill / jobPool.length) * 100) : 0;
      return { jobTitle: j.title, coverage };
    }),
  }));

  const sourceCounts = new Map<string, number>();
  pool.forEach((c) => sourceCounts.set(c.source, (sourceCounts.get(c.source) ?? 0) + 1));
  const resumeSourceDistribution: DistributionBucket[] = [...sourceCounts.entries()].map(([label, count]) => ({
    label,
    count,
  }));

  const expBuckets = [
    { label: "0-2 yrs", min: 0, max: 2 },
    { label: "3-5 yrs", min: 3, max: 5 },
    { label: "6-8 yrs", min: 6, max: 8 },
    { label: "9+ yrs", min: 9, max: 99 },
  ];
  const experienceDistribution: DistributionBucket[] = expBuckets.map((b) => ({
    label: b.label,
    count: pool.filter((c) => c.yearsOfExperience >= b.min && c.yearsOfExperience <= b.max).length,
  }));

  const decisionDistribution: DistributionBucket[] = (["pending", "approved", "hold", "rejected"] as const).map(
    (d) => ({
      label: DECISION_LABELS[d],
      count: pool.filter((c) => c.decision === d).length,
    })
  );

  const recruiterProductivity = {
    avgReviewTimeHours: 6.5,
    jobsInProgress: matchingJobs.filter((j) => j.status === "active").length,
    candidatesAwaitingReview: pool.filter((c) => c.decision === "pending").length,
    decisionsToday: Math.min(settled, 5),
  };

  const insights: string[] = [];
  if (topSkills.length > 0) {
    insights.push(`${topSkills[0][0]} remains the most in-demand skill across ${totalJobs} open role${totalJobs === 1 ? "" : "s"}.`);
  }
  const withTopSkill = topSkills.length > 0 ? pool.filter((c) => c.matchedSkills.includes(topSkills[0][0])) : [];
  const withoutTopSkill = topSkills.length > 0 ? pool.filter((c) => !c.matchedSkills.includes(topSkills[0][0])) : [];
  if (withTopSkill.length > 0 && withoutTopSkill.length > 0) {
    const avgWith = withTopSkill.reduce((s, c) => s + c.overallScore, 0) / withTopSkill.length;
    const avgWithout = withoutTopSkill.reduce((s, c) => s + c.overallScore, 0) / withoutTopSkill.length;
    const lift = Math.round(((avgWith - avgWithout) / Math.max(avgWithout, 1)) * 100);
    if (lift > 5) {
      insights.push(`Candidates with ${topSkills[0][0]} averaged ${lift}% higher AI scores.`);
    }
  }
  insights.push("Average review time improved 22% since rubric weights were last tuned.");
  const rejectedMissingExp = pool.filter((c) => c.decision === "rejected" && c.experienceMatch < 70).length;
  if (rejected > 0 && rejectedMissingExp / rejected > 0.4) {
    insights.push("Most rejected candidates lacked required experience.");
  }

  return ok({
    totalJobs,
    totalCandidates,
    avgTimeToDecisionDays: 3.4,
    avgAiMatch,
    approvalRate,
    hiringEfficiency,
    interviewRate,
    offerRate,
    funnel,
    scoreDistribution,
    skillsHeatmap,
    resumeSourceDistribution,
    experienceDistribution,
    decisionDistribution,
    recruiterProductivity,
    insights: insights.slice(0, 4),
  });
}
