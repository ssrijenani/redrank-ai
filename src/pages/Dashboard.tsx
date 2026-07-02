import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Briefcase, Users, TrendingUp, Clock } from "lucide-react";
import { Topbar } from "../layouts/Topbar";
import { Button, Card, CardHeader, Badge, EmptyState } from "../components/ui";
import { CardSkeleton, TableSkeleton } from "../components/ui/Skeleton";
import { fetchJobs } from "../services/api";
import { useToast } from "../hooks/useToast";
import type { JobSummary } from "../types";

const statusTone: Record<JobSummary["status"], "success" | "neutral" | "warning"> = {
  active: "success",
  draft: "warning",
  closed: "neutral",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<JobSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notReady = useCallback(
    (feature: string) => {
      showToast(`${feature} is coming soon`, {
        description: "This part of RedRank AI ships in an upcoming milestone.",
        tone: "info",
      });
    },
    [showToast]
  );

  const loadJobs = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchJobs()
      .then((res) => {
        if (!res.success) {
          setError(res.message ?? "Couldn't load your jobs. Check your connection and try again.");
          return;
        }
        setJobs(res.data);
      })
      .catch(() => setError("Couldn't load your jobs. Check your connection and try again."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const activeJobs = jobs?.filter((j) => j.status === "active") ?? [];
  const totalCandidates = jobs?.reduce((sum, j) => sum + j.candidateCount, 0) ?? 0;
  const avgScore =
    jobs && jobs.length > 0
      ? Math.round(jobs.reduce((sum, j) => sum + j.avgScore, 0) / jobs.length)
      : 0;

  const metrics = [
    {
      label: "Active jobs",
      value: activeJobs.length,
      icon: Briefcase,
      tone: "accent" as const,
    },
    {
      label: "Total candidates",
      value: totalCandidates,
      icon: Users,
      tone: "violet" as const,
    },
    {
      label: "Avg. AI score",
      value: jobs && jobs.length > 0 ? `${avgScore}` : "—",
      icon: TrendingUp,
      tone: "success" as const,
    },
    {
      label: "Avg. time to decision",
      value: "3.4d",
      icon: Clock,
      tone: "neutral" as const,
    },
  ];

  return (
    <>
      <Topbar
        actions={
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => navigate("/jobs/new")}>
            New Job
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        {/* Metric cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : metrics.map((m) => (
                <Card key={m.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-text-secondary">{m.label}</span>
                    <span
                      className={`flex size-7 items-center justify-center rounded-(--radius-md) ${
                        m.tone === "accent"
                          ? "bg-accent-600/10 text-accent-400"
                          : m.tone === "violet"
                            ? "bg-violet-500/10 text-violet-400"
                            : m.tone === "success"
                              ? "bg-success-500/10 text-success-400"
                              : "bg-surface-raised text-text-muted"
                      }`}
                    >
                      <m.icon className="size-3.5" />
                    </span>
                  </div>
                  <p className="mt-3 text-[26px] font-semibold tabular text-text-primary tracking-tight">
                    {m.value}
                  </p>
                </Card>
              ))}
        </div>

        {/* Recent jobs */}
        <div className="mt-8">
          <Card padding="lg">
            <CardHeader
              title="Recent jobs"
              description="Jobs you've created, ranked by most recently updated."
              action={
                !isLoading &&
                jobs &&
                jobs.length > 0 && (
                  <button
                    onClick={() => notReady("The full jobs list")}
                    className="text-[12px] font-medium text-accent-400 hover:text-accent-300 transition-colors"
                  >
                    View all
                  </button>
                )
              }
            />

            {isLoading && <TableSkeleton rows={4} cols={5} />}

            {!isLoading && error && (
              <EmptyState
                tone="error"
                title="Something went wrong"
                description={error}
                action={{ label: "Try again", onClick: loadJobs }}
              />
            )}

            {!isLoading && !error && jobs && jobs.length === 0 && (
              <EmptyState
                icon={<Briefcase className="size-5 text-text-muted" />}
                title="No jobs yet"
                description="Create your first job to generate an AI rubric and start ranking candidates."
                action={{ label: "Create a job", onClick: () => navigate("/jobs/new") }}
              />
            )}

            {!isLoading && !error && jobs && jobs.length > 0 && (
              <div className="overflow-hidden rounded-(--radius-lg) border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised/50">
                      <th className="px-4 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-text-muted">
                        Job
                      </th>
                      <th className="px-4 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-text-muted">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-[12px] font-medium uppercase tracking-wide text-text-muted">
                        Candidates
                      </th>
                      <th className="px-4 py-3 text-right text-[12px] font-medium uppercase tracking-wide text-text-muted">
                        Avg. score
                      </th>
                      <th className="px-4 py-3 text-right text-[12px] font-medium uppercase tracking-wide text-text-muted">
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="cursor-pointer border-b border-border last:border-b-0 transition-colors hover:bg-surface-hover"
                        onClick={() => notReady("Candidate Ranking")}
                      >
                        <td className="px-4 py-3 font-medium text-text-primary">{job.title}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone[job.status]}>{job.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right tabular text-text-secondary">
                          {job.candidateCount}
                        </td>
                        <td className="px-4 py-3 text-right tabular text-text-secondary">
                          {job.candidateCount > 0 ? job.avgScore : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-text-muted">
                          {timeAgo(job.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
