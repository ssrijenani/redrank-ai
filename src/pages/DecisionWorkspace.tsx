import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, Sparkles, MessageCircle, Briefcase } from "lucide-react";
import { Topbar } from "../layouts/Topbar";
import { EmptyState, Skeleton, Button } from "../components/ui";
import { CandidateProfileCard } from "../components/features/CandidateProfileCard";
import { ExplainabilityPanel } from "../components/features/ExplainabilityPanel";
import { InterviewQuestionList } from "../components/features/InterviewQuestionList";
import { DecisionPanel } from "../components/features/DecisionPanel";
import { ActivityTimeline } from "../components/features/ActivityTimeline";
import { AuditLog } from "../components/features/AuditLog";
import { ComingSoonCard } from "../components/features/ComingSoonCard";
import {
  fetchCandidateById,
  fetchDecisionRadar,
  fetchHiringRecommendation,
  fetchRiskFlags,
  fetchInterviewQuestions,
  fetchActivityTimeline,
  fetchAuditLog,
  fetchInterviewAssignment,
  assignInterview,
  recordWorkspaceDecision,
} from "../services/api";
import { useToast } from "../hooks/useToast";
import { DECISION_LABELS } from "../types";
import type {
  Candidate,
  ScoreBreakdown,
  HiringRecommendation,
  RiskFlag,
  ActivityEvent,
  AuditLogEntry,
  InterviewAssignment,
  DecisionAction,
  DecisionReason,
  InterviewPriority,
} from "../types";

export default function DecisionWorkspace() {
  const { jobId, candidateId } = useParams<{ jobId: string; candidateId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [radarData, setRadarData] = useState<ScoreBreakdown[]>([]);
  const [isLoadingRadar, setIsLoadingRadar] = useState(true);

  const [recommendation, setRecommendation] = useState<HiringRecommendation | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(true);

  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [isLoadingRiskFlags, setIsLoadingRiskFlags] = useState(true);

  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const [timeline, setTimeline] = useState<ActivityEvent[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);

  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(true);

  const [assignment, setAssignment] = useState<InterviewAssignment | null>(null);

  // Decision form state
  const [selectedAction, setSelectedAction] = useState<DecisionAction | null>(null);
  const [reason, setReason] = useState<DecisionReason>("Excellent Fit");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interview assignment form state
  const [interviewer, setInterviewer] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [priority, setPriority] = useState<InterviewPriority>("medium");
  const [isAssigning, setIsAssigning] = useState(false);

  const loadEverything = useCallback(() => {
    if (!candidateId) return;
    setIsLoading(true);
    setError(null);

    fetchCandidateById(candidateId)
      .then((res) => {
        if (!res.success || !res.data) {
          setError(res.message ?? "This candidate couldn't be found.");
          return;
        }
        setCandidate(res.data);
      })
      .catch(() => setError("Couldn't load this candidate. Check your connection and try again."))
      .finally(() => setIsLoading(false));

    setIsLoadingRadar(true);
    fetchDecisionRadar(candidateId)
      .then((res) => res.success && setRadarData(res.data))
      .finally(() => setIsLoadingRadar(false));

    setIsLoadingRecommendation(true);
    fetchHiringRecommendation(candidateId)
      .then((res) => res.success && setRecommendation(res.data))
      .finally(() => setIsLoadingRecommendation(false));

    setIsLoadingRiskFlags(true);
    fetchRiskFlags(candidateId)
      .then((res) => res.success && setRiskFlags(res.data))
      .finally(() => setIsLoadingRiskFlags(false));

    setIsLoadingQuestions(true);
    fetchInterviewQuestions(candidateId)
      .then((res) => res.success && setQuestions(res.data))
      .finally(() => setIsLoadingQuestions(false));

    setIsLoadingTimeline(true);
    fetchActivityTimeline(candidateId)
      .then((res) => res.success && setTimeline(res.data))
      .finally(() => setIsLoadingTimeline(false));

    setIsLoadingAudit(true);
    fetchAuditLog(candidateId)
      .then((res) => res.success && setAuditEntries(res.data))
      .finally(() => setIsLoadingAudit(false));

    fetchInterviewAssignment(candidateId).then((res) => {
      if (res.success && res.data) {
        setAssignment(res.data);
        setInterviewer(res.data.interviewer);
        setInterviewDate(res.data.date);
        setPriority(res.data.priority);
      }
    });
  }, [candidateId]);

  useEffect(() => {
    loadEverything();
  }, [loadEverything]);

  const refreshTimelineAndAudit = useCallback(() => {
    if (!candidateId) return;
    fetchActivityTimeline(candidateId).then((res) => res.success && setTimeline(res.data));
    fetchAuditLog(candidateId).then((res) => res.success && setAuditEntries(res.data));
  }, [candidateId]);

  const handleSubmitDecision = useCallback(
    (actionOverride?: DecisionAction) => {
      const action = actionOverride ?? selectedAction;
      if (!candidateId || !action) return;
      setIsSubmitting(true);
      recordWorkspaceDecision(candidateId, action, reason, note)
        .then((res) => {
          if (res.success && res.data) {
            setCandidate(res.data);
            setSelectedAction(action);
            setNote("");
            showToast(`Candidate ${DECISION_LABELS[action]}`, {
              tone: action === "rejected" ? "info" : "success",
            });
            refreshTimelineAndAudit();
          } else {
            showToast("Couldn't record this decision", { description: res.message ?? undefined, tone: "error" });
          }
        })
        .finally(() => setIsSubmitting(false));
    },
    [candidateId, selectedAction, reason, note, showToast, refreshTimelineAndAudit]
  );

  const handleAssignInterview = useCallback(() => {
    if (!candidateId || !interviewer.trim() || !interviewDate) return;
    setIsAssigning(true);
    assignInterview(candidateId, { interviewer: interviewer.trim(), date: interviewDate, priority })
      .then((res) => {
        if (res.success) {
          setAssignment(res.data);
          showToast("Interview assigned", { tone: "success" });
          refreshTimelineAndAudit();
        } else {
          showToast("Couldn't assign interview", { tone: "error" });
        }
      })
      .finally(() => setIsAssigning(false));
  }, [candidateId, interviewer, interviewDate, priority, showToast, refreshTimelineAndAudit]);

  if (isLoading) {
    return (
      <>
        <Topbar title="Decision Workspace" />
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr_320px]">
            <Skeleton className="h-96 w-full rounded-(--radius-lg)" />
            <Skeleton className="h-96 w-full rounded-(--radius-lg)" />
            <Skeleton className="h-96 w-full rounded-(--radius-lg)" />
          </div>
        </div>
      </>
    );
  }

  if (error || !candidate) {
    return (
      <>
        <Topbar title="Decision Workspace" />
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
          <EmptyState
            tone="error"
            icon={<Users className="size-5 text-error-400" />}
            title="Couldn't load this candidate"
            description={error ?? "This candidate may have been removed or the link is incorrect."}
            action={{
              label: "Back to Ranking",
              onClick: () => navigate(jobId ? `/jobs/${jobId}/candidates` : "/dashboard"),
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Decision Workspace" />

      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6 pb-28">
        <div className="mb-6 flex items-center gap-2 text-[12.5px]">
          <Briefcase className="size-3.5 text-text-muted" />
          <button
            onClick={() => navigate(`/jobs/${jobId}/candidates`)}
            className="text-accent-400 hover:text-accent-300 transition-colors"
          >
            Candidate Ranking
          </button>
          <span className="text-text-muted">/</span>
          <span className="text-text-secondary">{candidate.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr_320px] items-start">
          {/* LEFT — Candidate Snapshot */}
          <div className="lg:sticky lg:top-[4.5rem]">
            <CandidateProfileCard
              candidate={candidate}
              riskFlags={riskFlags}
              isLoadingRiskFlags={isLoadingRiskFlags}
            />
          </div>

          {/* CENTER — AI Explainability (hero) */}
          <div>
            <ExplainabilityPanel
              candidate={candidate}
              radarData={radarData}
              isLoadingRadar={isLoadingRadar}
              recommendation={recommendation}
              isLoadingRecommendation={isLoadingRecommendation}
            />
            <div className="mt-5">
              <InterviewQuestionList questions={questions} isLoading={isLoadingQuestions} />
            </div>
          </div>

          {/* RIGHT — Recruiter Workspace */}
          <div className="space-y-5">
            <DecisionPanel
              selectedAction={selectedAction}
              onSelectAction={setSelectedAction}
              reason={reason}
              onReasonChange={setReason}
              note={note}
              onNoteChange={setNote}
              onSubmit={() => handleSubmitDecision()}
              isSubmitting={isSubmitting}
              interviewer={interviewer}
              onInterviewerChange={setInterviewer}
              interviewDate={interviewDate}
              onInterviewDateChange={setInterviewDate}
              priority={priority}
              onPriorityChange={setPriority}
              onAssignInterview={handleAssignInterview}
              isAssigning={isAssigning}
              currentAssignment={assignment}
            />

            <ActivityTimeline events={timeline} isLoading={isLoadingTimeline} />
            <AuditLog entries={auditEntries} isLoading={isLoadingAudit} />

            <ComingSoonCard
              icon={Users}
              title="Compare Candidates"
              description="Side-by-side comparison across your shortlist is on the roadmap."
            />
            <ComingSoonCard
              icon={MessageCircle}
              title="AI Chat Assistant"
              description="Ask questions about this candidate in natural language — coming soon."
            />
          </div>
        </div>
      </div>

      {/* Final decision — large sticky CTA */}
      <div className="sticky bottom-0 border-t border-border bg-bg/95 backdrop-blur px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12.5px] text-text-secondary">
            <Sparkles className="size-3.5 text-violet-400" />
            AI recommends{" "}
            <span className="font-semibold text-text-primary">
              {recommendation?.tier ?? "…"}
            </span>
            — final call is yours.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleSubmitDecision("hold")}
              disabled={isSubmitting}
            >
              Hold
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => handleSubmitDecision("rejected")}
              disabled={isSubmitting}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={() => handleSubmitDecision("approved")}
              disabled={isSubmitting}
            >
              Approve
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
