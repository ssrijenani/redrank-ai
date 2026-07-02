import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  FileStack,
  TrendingUp,
  Zap,
  CalendarCheck,
  Award,
  Clock,
  ListChecks,
  Hourglass,
  CheckSquare,
  Download,
  FileText,
  FileDown,
  BarChart3,
} from "lucide-react";
import { Topbar } from "../layouts/Topbar";
import { Card, EmptyState, Skeleton, Button } from "../components/ui";
import { AIInsightsCard } from "../components/features/AIInsightsCard";
import { AnalyticsCard } from "../components/features/AnalyticsCard";
import { AnalyticsFilters } from "../components/features/AnalyticsFilters";
import { HiringFunnelChart } from "../components/features/HiringFunnelChart";
import { DistributionBarChart } from "../components/features/DistributionBarChart";
import { SkillHeatmap } from "../components/features/SkillHeatmap";
import { DecisionDistributionChart } from "../components/features/DecisionDistributionChart";
import { fetchAnalytics, fetchAnalyticsFilterOptions } from "../services/api";
import { useToast } from "../hooks/useToast";
import { exportAnalyticsToCsv, exportAnalyticsReport } from "../lib/export";
import type { AnalyticsSummary, AnalyticsFilters as AnalyticsFiltersState } from "../types";

export default function Analytics() {
  const { showToast } = useToast();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<AnalyticsFiltersState>({});
  const [filterOptions, setFilterOptions] = useState<{
    jobs: { id: string; title: string }[];
    departments: string[];
    recruiters: string[];
  }>({ jobs: [], departments: [], recruiters: [] });

  useEffect(() => {
    fetchAnalyticsFilterOptions().then((res) => {
      if (res.success) setFilterOptions(res.data);
    });
  }, []);

  const loadAnalytics = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchAnalytics(filters)
      .then((res) => {
        if (!res.success) {
          setError(res.message ?? "Couldn't load analytics right now.");
          return;
        }
        setSummary(res.data);
      })
      .catch(() => setError("Couldn't load analytics. Check your connection and try again."))
      .finally(() => setIsLoading(false));
  }, [filters]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const kpiCards = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Jobs Created", value: summary.totalJobs, icon: Briefcase, tone: "neutral" as const },
      { label: "Resumes Processed", value: summary.totalCandidates, icon: FileStack, tone: "accent" as const },
      { label: "Average AI Match", value: `${summary.avgAiMatch}%`, icon: TrendingUp, tone: "success" as const },
      { label: "Hiring Efficiency", value: `${summary.hiringEfficiency}%`, icon: Zap, tone: "accent" as const },
      { label: "Interview Rate", value: `${summary.interviewRate}%`, icon: CalendarCheck, tone: "warning" as const },
      { label: "Offer Rate", value: `${summary.offerRate}%`, icon: Award, tone: "success" as const },
    ];
  }, [summary]);

  const productivityCards = useMemo(() => {
    if (!summary) return [];
    const p = summary.recruiterProductivity;
    return [
      { label: "Average Review Time", value: `${p.avgReviewTimeHours}h`, icon: Clock, tone: "neutral" as const },
      { label: "Jobs In Progress", value: p.jobsInProgress, icon: ListChecks, tone: "accent" as const },
      { label: "Candidates Awaiting Review", value: p.candidatesAwaitingReview, icon: Hourglass, tone: "warning" as const },
      { label: "Decisions Made Today", value: p.decisionsToday, icon: CheckSquare, tone: "success" as const },
    ];
  }, [summary]);

  if (isLoading) {
    return (
      <>
        <Topbar title="Analytics" />
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
          <Skeleton className="h-4 w-56 mb-2" />
          <Skeleton className="h-3 w-80 mb-6" />
          <Skeleton className="h-10 w-full max-w-2xl mb-6" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-(--radius-lg)" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-(--radius-lg)" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error || !summary) {
    return (
      <>
        <Topbar title="Analytics" />
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
          <EmptyState
            tone="error"
            icon={<BarChart3 className="size-5 text-error-400" />}
            title="Couldn't load analytics"
            description={error ?? "Something went wrong loading your hiring analytics."}
            action={{ label: "Try again", onClick: loadAnalytics }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Analytics" />

      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[19px] font-semibold text-text-primary tracking-tight">
              Executive Hiring Analytics
            </h1>
            <p className="mt-1 text-[13px] text-text-secondary">
              A real-time view of hiring performance across every job, department, and recruiter.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Download className="size-3.5" />}
              onClick={() => {
                exportAnalyticsToCsv(summary);
                showToast("Analytics exported", { description: "analytics-summary.csv", tone: "success" });
              }}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<FileText className="size-3.5" />}
              onClick={() =>
                showToast("PDF export coming soon", {
                  description: "This will generate a formatted PDF report once available.",
                  tone: "info",
                })
              }
            >
              Export PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<FileDown className="size-3.5" />}
              onClick={() => {
                exportAnalyticsReport(summary);
                showToast("Report downloaded", { description: "hiring-report.txt", tone: "success" });
              }}
            >
              Download Report
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <AnalyticsFilters
            value={filters}
            onChange={setFilters}
            jobs={filterOptions.jobs}
            departments={filterOptions.departments}
            recruiters={filterOptions.recruiters}
          />
        </div>

        {summary.totalCandidates === 0 ? (
          <EmptyState
            icon={<BarChart3 className="size-5 text-text-muted" />}
            title="No data for these filters"
            description="Try a different job, department, recruiter, or date range."
            action={{ label: "Clear filters", onClick: () => setFilters({}) }}
          />
        ) : (
          <>
            {/* Top KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 mb-6">
              {kpiCards.map((m) => (
                <AnalyticsCard key={m.label} label={m.label} value={m.value} icon={m.icon} tone={m.tone} />
              ))}
            </div>

            {/* AI Insights */}
            <div className="mb-6">
              <AIInsightsCard insights={summary.insights} isLoading={false} />
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-6">
              <Card>
                <h3 className="mb-1 text-[13.5px] font-semibold text-text-primary">Hiring Funnel</h3>
                <p className="mb-3 text-[12px] text-text-secondary">
                  Candidates at each stage, from application to approval.
                </p>
                <HiringFunnelChart data={summary.funnel} />
              </Card>

              <Card>
                <h3 className="mb-1 text-[13.5px] font-semibold text-text-primary">
                  Candidate Score Distribution
                </h3>
                <p className="mb-3 text-[12px] text-text-secondary">AI match scores across the pool.</p>
                <DistributionBarChart
                  data={summary.scoreDistribution.map((b) => ({ label: b.range, count: b.count }))}
                  color="#6366F1"
                />
              </Card>

              <Card>
                <h3 className="mb-1 text-[13.5px] font-semibold text-text-primary">
                  Hiring Decision Distribution
                </h3>
                <p className="mb-3 text-[12px] text-text-secondary">Where candidates landed after review.</p>
                <DecisionDistributionChart data={summary.decisionDistribution} />
              </Card>

              <Card>
                <h3 className="mb-1 text-[13.5px] font-semibold text-text-primary">
                  Resume Source Distribution
                </h3>
                <p className="mb-3 text-[12px] text-text-secondary">Where applications are coming from.</p>
                <DistributionBarChart data={summary.resumeSourceDistribution} color="#8B5CF6" />
              </Card>

              <Card>
                <h3 className="mb-1 text-[13.5px] font-semibold text-text-primary">
                  Experience Distribution
                </h3>
                <p className="mb-3 text-[12px] text-text-secondary">Years of experience across candidates.</p>
                <DistributionBarChart data={summary.experienceDistribution} color="#10B981" />
              </Card>

              <Card>
                <h3 className="mb-1 text-[13.5px] font-semibold text-text-primary">Skill Demand Heatmap</h3>
                <p className="mb-3 text-[12px] text-text-secondary">
                  Top matched skills, coverage by job.
                </p>
                <SkillHeatmap data={summary.skillsHeatmap} />
              </Card>
            </div>

            {/* Recruiter productivity */}
            <div className="mb-2">
              <h2 className="mb-3 text-[14px] font-semibold text-text-primary">Recruiter Productivity</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {productivityCards.map((m) => (
                  <AnalyticsCard key={m.label} label={m.label} value={m.value} icon={m.icon} tone={m.tone} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
