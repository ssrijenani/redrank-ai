import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Briefcase, FileX2 } from "lucide-react";
import { Topbar } from "../layouts/Topbar";
import { Button, Dialog, EmptyState, Skeleton } from "../components/ui";
import { ResumeDropzone } from "../components/features/ResumeDropzone";
import { ResumeUploadList } from "../components/features/ResumeUploadList";
import { UploadSummary } from "../components/features/UploadSummary";
import { UploadKpiCards } from "../components/features/UploadKpiCards";
import { ReadyForRankingCard } from "../components/features/ReadyForRankingCard";
import {
  fetchJobById,
  fetchResumeUploads,
  initiateResumeUpload,
  removeResumeUpload,
  retryResumeUpload,
} from "../services/api";
import { useToast } from "../hooks/useToast";
import { formatFileSize, formatTime } from "../lib/format";
import { MAX_UPLOAD_FILES } from "../config/constants";
import type { Job, ResumeUpload } from "../types";

const NON_TERMINAL = new Set(["queued", "uploading", "parsing"]);

export default function ResumeUpload() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);

  const [uploads, setUploads] = useState<ResumeUpload[]>([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);
  const [pendingActionIds, setPendingActionIds] = useState<Set<string>>(new Set());
  const [viewingUpload, setViewingUpload] = useState<ResumeUpload | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadJob = useCallback(() => {
    if (!jobId) return;
    setIsLoadingJob(true);
    setJobError(null);
    fetchJobById(jobId)
      .then((res) => {
        if (!res.success || !res.data) {
          setJobError(res.message ?? "This job couldn't be found.");
          return;
        }
        setJob(res.data);
      })
      .catch(() => setJobError("Couldn't load this job. Check your connection and try again."))
      .finally(() => setIsLoadingJob(false));
  }, [jobId]);

  const refreshUploads = useCallback(() => {
    if (!jobId) return;
    fetchResumeUploads(jobId).then((res) => {
      if (res.success) setUploads(res.data);
    });
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    if (!jobId) return;
    setIsLoadingUploads(true);
    fetchResumeUploads(jobId)
      .then((res) => {
        if (res.success) setUploads(res.data);
      })
      .finally(() => setIsLoadingUploads(false));
  }, [jobId]);

  // Poll while any upload is still mid-flight; stop automatically once settled.
  useEffect(() => {
    const hasActive = uploads.some((u) => NON_TERMINAL.has(u.status));

    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(refreshUploads, 500);
    }
    if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [uploads, refreshUploads]);

  const handleFilesAccepted = useCallback(
    (files: File[]) => {
      if (!jobId) return;
      const meta = files.map((f) => ({ fileName: f.name, fileSizeKb: f.size / 1024 }));
      initiateResumeUpload(jobId, meta).then((res) => {
        if (!res.success) {
          showToast("Couldn't start upload", {
            description: res.message ?? "Please try again.",
            tone: "error",
          });
          return;
        }
        setUploads((prev) => [...prev, ...res.data]);
      });
    },
    [jobId, showToast]
  );

  const handleFilesRejected = useCallback(
    (rejected: { fileName: string; reason: string }[]) => {
      if (rejected.length === 1) {
        showToast(`"${rejected[0].fileName}" wasn't added`, {
          description: rejected[0].reason,
          tone: "error",
        });
      } else if (rejected.length > 1) {
        showToast(`${rejected.length} files weren't added`, {
          description: rejected[0].reason,
          tone: "error",
        });
      }
    },
    [showToast]
  );

  const handleView = useCallback((upload: ResumeUpload) => {
    setViewingUpload(upload);
  }, []);

  const handleRemove = useCallback(
    (upload: ResumeUpload) => {
      if (!jobId) return;
      const key = `remove-${upload.id}`;
      setPendingActionIds((prev) => new Set(prev).add(key));
      removeResumeUpload(jobId, upload.id)
        .then((res) => {
          if (res.success && res.data.removed) {
            setUploads((prev) => prev.filter((u) => u.id !== upload.id));
          } else {
            showToast("Couldn't remove this file", { tone: "error" });
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
    [jobId, showToast]
  );

  const handleRetry = useCallback(
    (upload: ResumeUpload) => {
      if (!jobId) return;
      const key = `retry-${upload.id}`;
      setPendingActionIds((prev) => new Set(prev).add(key));
      retryResumeUpload(jobId, upload.id)
        .then((res) => {
          if (res.success && res.data) {
            setUploads((prev) => prev.map((u) => (u.id === upload.id ? res.data! : u)));
          } else {
            showToast("Couldn't retry this upload", {
              description: res.message ?? undefined,
              tone: "error",
            });
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
    [jobId, showToast]
  );

  const total = uploads.length;
  const completed = uploads.filter((u) => u.status === "completed").length;
  const failed = uploads.filter((u) => u.status === "failed").length;
  const inProgress = uploads.filter((u) => NON_TERMINAL.has(u.status)).length;
  const allSettled = total > 0 && inProgress === 0;
  const remainingSlots = Math.max(0, MAX_UPLOAD_FILES - total);

  if (isLoadingJob) {
    return (
      <>
        <Topbar title="Candidate Upload" />
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-3 w-72 mb-6" />
          <Skeleton className="h-56 w-full rounded-(--radius-xl)" />
        </div>
      </>
    );
  }

  if (jobError || !job) {
    return (
      <>
        <Topbar title="Candidate Upload" />
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6">
          <EmptyState
            tone="error"
            icon={<Briefcase className="size-5 text-error-400" />}
            title="Job not found"
            description={jobError ?? "This job may have been removed or the link is incorrect."}
            action={{ label: "Back to Dashboard", onClick: () => navigate("/dashboard") }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Candidate Upload" />

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 pb-28">
        <div className="mb-6">
          <p className="text-[12.5px] font-medium text-accent-400">{job.title}</p>
          <h1 className="mt-0.5 text-[19px] font-semibold text-text-primary tracking-tight">
            Candidate Upload
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Upload candidate resumes for AI evaluation.
          </p>
        </div>

        <ResumeDropzone
          remainingSlots={remainingSlots}
          onFilesAccepted={handleFilesAccepted}
          onFilesRejected={handleFilesRejected}
        />

        <div className="mt-6 space-y-4">
          {isLoadingUploads && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-(--radius-lg)" />
              ))}
            </div>
          )}

          {!isLoadingUploads && total === 0 && (
            <EmptyState
              icon={<FileX2 className="size-5 text-text-muted" />}
              title="No resumes uploaded yet"
              description="Drag files into the zone above, or click it to browse your computer."
            />
          )}

          {!isLoadingUploads && total > 0 && (
            <>
              <UploadKpiCards total={total} completed={completed} uploading={inProgress} failed={failed} />

              <UploadSummary total={total} completed={completed} failed={failed} inProgress={inProgress} />

              {allSettled && completed > 0 && (
                <ReadyForRankingCard completedCount={completed} failedCount={failed} />
              )}

              <ResumeUploadList
                uploads={uploads}
                onView={handleView}
                onRemove={handleRemove}
                onRetry={handleRetry}
                pendingActionIds={pendingActionIds}
              />
            </>
          )}
        </div>
      </div>

      {/* Persistent bottom CTA — enabled as soon as at least one resume has finished processing successfully */}
      <div className="sticky bottom-0 border-t border-border bg-bg/95 backdrop-blur px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <p className="text-[12.5px] text-text-secondary">
            {total === 0
              ? "Upload at least one resume to continue."
              : completed > 0 && allSettled
                ? failed > 0
                  ? `${completed} completed, ${failed} failed. You can continue or retry the failed uploads.`
                  : "All resumes processed successfully."
                : `${completed + failed} / ${total} processed…`}
          </p>
          <Button
            size="md"
            disabled={completed === 0}
            icon={<ArrowRight className="size-4" />}
            iconPosition="right"
            onClick={() => navigate(`/jobs/${jobId}/candidates`)}
          >
            {completed > 0 ? `Continue to AI Ranking (${completed} Candidate${completed === 1 ? "" : "s"})` : "Continue to AI Ranking"}
          </Button>
        </div>
      </div>

      <Dialog
        open={Boolean(viewingUpload)}
        onClose={() => setViewingUpload(null)}
        title={viewingUpload?.candidateName ?? "Resume preview"}
        description={viewingUpload?.fileName}
        size="sm"
      >
        {viewingUpload && (
          <div className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Pages</span>
              <span className="text-text-primary tabular">{viewingUpload.pageCount ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">File size</span>
              <span className="text-text-primary tabular">{formatFileSize(viewingUpload.fileSizeKb)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Uploaded</span>
              <span className="text-text-primary tabular">{formatTime(viewingUpload.uploadedAt)}</span>
            </div>
            <div className="rounded-(--radius-md) border border-border bg-surface-raised p-3 text-[12px] text-text-muted leading-relaxed">
              Full document preview isn't available in this environment. Once the backend is
              connected, this will render the parsed resume content.
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
