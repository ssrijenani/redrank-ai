import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Star,
  AlertCircle,
  XCircle as XCircleIcon,
  Briefcase,
  UsersRound,
  ShieldCheck,
} from "lucide-react";
import { Topbar } from "../layouts/Topbar";
import { Card, EmptyState, Skeleton } from "../components/ui";
import { AIInsightsCard } from "../components/features/AIInsightsCard";
import {
  CandidateFilters,
  DEFAULT_FILTER_STATE,
  type CandidateFilterState,
} from "../components/features/CandidateFilters";
import { BulkActionsBar } from "../components/features/BulkActionsBar";
import { CandidateRankingTable } from "../components/features/CandidateRankingTable";
import { CandidateDrawer } from "../components/features/CandidateDrawer";
import {
  fetchJobById,
  fetchCandidatesByJob,
  fetchRankingInsights,
  submitDecision,
  bulkSubmitDecision,
  addCandidateNote,
} from "../services/api";
import { useToast } from "../hooks/useToast";
import { exportCandidatesToCsv } from "../lib/export";
import { INTERVIEW_RECOMMENDED_THRESHOLD } from "../config/constants";
import type { Candidate, Job } from "../types";

function applyFiltersAndSort(candidates: Candidate[], filters: CandidateFilterState): Candidate[] {
  const search = filters.search.trim().toLowerCase();

  const filtered = candidates.filter((c) => {
    if (search && !`${c.name} ${c.title}`.toLowerCase().includes(search)) return false;
    if (c.overallScore < filters.minScore) return false;
    if (c.experienceMatch < filters.minExperience) return false;
    if (filters.educationLevel && c.educationLevel !== filters.educationLevel) return false;
    if (
      filters.requiredSkills.length > 0 &&
      !filters.requiredSkills.every((s) => c.matchedSkills.includes(s))
    ) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
    case "experience":
      sorted.sort((a, b) => b.experienceMatch - a.experienceMatch);
      break;
    case "recent":
      sorted.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "aiMatch":
    default:
      sorted.sort((a, b) => b.overallScore - a.overallScore);
      break;
  }
  return sorted;
}

export default function CandidateRanking() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CandidateFilterState>(DEFAULT_FILTER_STATE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerCandidate, setDrawerCandidate] = useState<Candidate | null>(null);
  const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const loadAll = useCallback(() => {
    if (!jobId) return;
    setIsLoading(true);
    setIsLoadingInsights(true);
    setError(null);

    Promise.all([fetchJobById(jobId), fetchCandidatesByJob(jobId)])
      .then(([jobRes, candidatesRes]) => {
        if (!jobRes.success || !jobRes.data) {
          setError(jobRes.message ?? "This job couldn't be found.");
          return;
        }
        if (!candidatesRes.success) {
          setError(candidatesRes.message ?? "Couldn't load candidates for this job.");
          return;
        }
        setJob(jobRes.data);
        setCandidates(candidatesRes.data);
      })
      .catch(() => setError("Couldn't load this page. Check your connection and try again."))
      .finally(() => setIsLoading(false));

    fetchRankingInsights(jobId)
      .then((res) => {
        if (res.success) setInsights(res.data);
      })
      .finally(() => setIsLoadingInsights(false));
  }, [jobId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const visibleCandidates = useMemo(
    () => applyFiltersAndSort(candidates, filters),
    [candidates, filters]
  );

  const availableSkills = useMemo(() => {
    const counts = new Map<string, number>();
    candidates.forEach((c) => c.matchedSkills.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);
  }, [candidates]);

  const availableEducationLevels = useMemo(() => {
    return [...new Set(candidates.map((c) => c.educationLevel))].sort();
  }, [candidates]);

  const kpis = useMemo(() => {
    const total = candidates.length;
    const avgMatch =
      total > 0 ? Math.round(candidates.reduce((s, c) => s + c.overallScore, 0) / total) : 0;
    const interviewRecommended = candidates.filter(
      (c) => c.overallScore >= INTERVIEW_RECOMMENDED_THRESHOLD
    ).length;
    const needsReview = candidates.filter((c) => c.decision === "hold").length;
    const rejected = candidates.filter((c) => c.decision === "rejected").length;
    return { total, avgMatch, interviewRecommended, needsReview, rejected };
  }, [candidates]);

  const updateCandidate = useCallback((updated: Candidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setDrawerCandidate((prev) => (prev && prev.id === updated.id ? updated : prev));
  }, []);

  const handleShortlist = useCallback(
    (candidate: Candidate) => {
      const key = `shortlist-${candidate.id}`;
      setPendingActionIds((prev) => new Set(prev).add(key));
      submitDecision(candidate.id, "approved")
        .then((res) => {
          if (res.success && res.data) {
            updateCandidate(res.data);
            showToast(`${candidate.name} shortlisted`, { tone: "success" });
          } else {
            showToast("Couldn't update this candidate", { tone: "error" });
          }
        })
        .finally(() => {
          setPendingActionIds((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        });
    },
    [showToast, updateCandidate]
  );

  const handleReject = useCallback(
    (candidate: Candidate) => {
      const key = `reject-${candidate.id}`;
      setPendingActionIds((prev) => new Set(prev).add(key));
      submitDecision(candidate.id, "rejected")
        .then((res) => {
          if (res.success && res.data) {
            updateCandidate(res.data);
            showToast(`${candidate.name} rejected`, { tone: "info" });
          } else {
            showToast("Couldn't update this candidate", { tone: "error" });
          }
        })
        .finally(() => {
          setPendingActionIds((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        });
    },
    [showToast, updateCandidate]
  );

  const handleAddNote = useCallback(
    (candidate: Candidate, note: string) => {
      addCandidateNote(candidate.id, note).then((res) => {
        if (res.success && res.data) {
          updateCandidate(res.data);
          showToast("Note added", { tone: "success" });
        } else {
          showToast("Couldn't save this note", { tone: "error" });
        }
      });
    },
    [showToast, updateCandidate]
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allVisibleSelected = visibleCandidates.every((c) => prev.has(c.id));
      if (allVisibleSelected) return new Set();
      return new Set(visibleCandidates.map((c) => c.id));
    });
  }, [visibleCandidates]);

  const handleBulkShortlist = useCallback(() => {
    setIsBulkProcessing(true);
    bulkSubmitDecision([...selectedIds], "approved")
      .then((res) => {
        if (res.success) {
          setCandidates((prev) =>
            prev.map((c) => res.data.find((u) => u.id === c.id) ?? c)
          );
          showToast(res.message ?? "Candidates shortlisted", { tone: "success" });
          setSelectedIds(new Set());
        }
      })
      .finally(() => setIsBulkProcessing(false));
  }, [selectedIds, showToast]);

  const handleBulkReject = useCallback(() => {
    setIsBulkProcessing(true);
    bulkSubmitDecision([...selectedIds], "rejected")
      .then((res) => {
        if (res.success) {
          setCandidates((prev) =>
            prev.map((c) => res.data.find((u) => u.id === c.id) ?? c)
          );
          showToast(res.message ?? "Candidates rejected", { tone: "info" });
          setSelectedIds(new Set());
        }
      })
      .finally(() => setIsBulkProcessing(false));
  }, [selectedIds, showToast]);

  const handleExportSelected = useCallback(() => {
    const selected = candidates.filter((c) => selectedIds.has(c.id));
    exportCandidatesToCsv(selected, `${job?.title ?? "candidates"}-selected.csv`);
    showToast(`Exported ${selected.length} candidate${selected.length === 1 ? "" : "s"}`, {
      tone: "success",
    });
  }, [candidates, selectedIds, job, showToast]);

  const kpiCards = [
    { label: "Total Candidates", value: kpis.total, icon: UsersRound, tone: "neutral" as const },
    { label: "Average AI Match", value: `${kpis.avgMatch}%`, icon: TrendingUp, tone: "accent" as const },
    { label: "Interview Recommended", value: kpis.interviewRecommended, icon: Star, tone: "success" as const },
    { label: "Needs Review", value: kpis.needsReview, icon: AlertCircle, tone: "warning" as const },
    { label: "Rejected", value: kpis.rejected, icon: XCircleIcon, tone: "error" as const },
  ];

  if (isLoading) {
    return (
      <>
        <Topbar title="Candidate Ranking" />
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-3 w-72 mb-6" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-(--radius-lg)" />
            ))}
          </div>
          <Skeleton className="h-24 w-full rounded-(--radius-xl) mb-6" />
          <Skeleton className="h-12 w-full rounded-(--radius-lg) mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-(--radius-lg)" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error || !job) {
    return (
      <>
        <Topbar title="Candidate Ranking" />
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
          <EmptyState
            tone="error"
            icon={<Briefcase className="size-5 text-error-400" />}
            title="Couldn't load candidates"
            description={error ?? "This job may have been removed or the link is incorrect."}
            action={{ label: "Back to Dashboard", onClick: () => navigate("/dashboard") }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Candidate Ranking" />

      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
        <div className="mb-6">
          <p className="text-[12.5px] font-medium text-accent-400">{job.title}</p>
          <h1 className="mt-0.5 text-[19px] font-semibold text-text-primary tracking-tight">
            Candidate Ranking
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Every candidate scored and explained against your hiring rubric. You stay in control of every decision.
          </p>
        </div>

        {candidates.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5 text-text-muted" />}
            title="No candidates yet"
            description="Upload resumes for this job to generate AI-ranked candidates."
            action={{ label: "Go to Resume Upload", onClick: () => navigate(`/jobs/${jobId}/upload`) }}
          />
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 mb-6">
              {kpiCards.map((m) => (
                <Card key={m.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-medium text-text-secondary">{m.label}</span>
                    <span
                      className={`flex size-7 items-center justify-center rounded-(--radius-md) ${
                        m.tone === "accent"
                          ? "bg-accent-600/10 text-accent-400"
                          : m.tone === "success"
                            ? "bg-success-500/10 text-success-400"
                            : m.tone === "warning"
                              ? "bg-warning-500/10 text-warning-400"
                              : m.tone === "error"
                                ? "bg-error-500/10 text-error-400"
                                : "bg-surface-raised text-text-muted"
                      }`}
                    >
                      <m.icon className="size-3.5" />
                    </span>
                  </div>
                  <p className="mt-2.5 text-[22px] font-semibold tabular text-text-primary tracking-tight">
                    {m.value}
                  </p>
                </Card>
              ))}
            </div>

            {/* AI Insights */}
            <div className="mb-6">
              <AIInsightsCard insights={insights} isLoading={isLoadingInsights} />
            </div>

            {/* Filters */}
            <CandidateFilters
              value={filters}
              onChange={setFilters}
              availableSkills={availableSkills}
              availableEducationLevels={availableEducationLevels}
              resultCount={visibleCandidates.length}
            />

            <div className="mt-4">
              <BulkActionsBar
                selectedCount={selectedIds.size}
                onShortlistSelected={handleBulkShortlist}
                onRejectSelected={handleBulkReject}
                onExportSelected={handleExportSelected}
                onClearSelection={() => setSelectedIds(new Set())}
                isProcessing={isBulkProcessing}
              />

              {visibleCandidates.length === 0 ? (
                <EmptyState
                  icon={<Users className="size-5 text-text-muted" />}
                  title="No candidates match these filters"
                  description="Try loosening a filter or clearing them to see the full pool."
                  action={{ label: "Clear filters", onClick: () => setFilters(DEFAULT_FILTER_STATE) }}
                />
              ) : (
                <CandidateRankingTable
                  candidates={visibleCandidates}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onView={setDrawerCandidate}
                  onShortlist={handleShortlist}
                  onReject={handleReject}
                  onAddNote={handleAddNote}
                  pendingActionIds={pendingActionIds}
                />
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 flex items-start gap-2 rounded-(--radius-md) border border-border bg-surface-raised/50 px-4 py-3">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-text-muted" />
              <p className="text-[11.5px] leading-relaxed text-text-muted">
                AI recommendations assist recruiters. Final hiring decisions remain with the recruiter.
              </p>
            </div>
          </>
        )}
      </div>

      <CandidateDrawer
        candidate={drawerCandidate}
        jobId={jobId ?? ""}
        onClose={() => setDrawerCandidate(null)}
      />
    </>
  );
}
