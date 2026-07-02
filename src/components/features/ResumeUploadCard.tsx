import {
  FileText,
  Clock,
  Layers,
  HardDrive,
  Eye,
  Trash2,
  RotateCw,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { ResumeUpload, ResumeUploadStatus } from "../../types";
import { RESUME_UPLOAD_STATUS_LABELS } from "../../types";
import { Badge } from "../ui";
import { UploadProgress } from "./UploadProgress";
import { formatFileSize, formatTime } from "../../lib/format";
import { cn } from "../../lib/cn";

interface ResumeUploadCardProps {
  upload: ResumeUpload;
  onView: (upload: ResumeUpload) => void;
  onRemove: (upload: ResumeUpload) => void;
  onRetry: (upload: ResumeUpload) => void;
  isRetrying?: boolean;
  isRemoving?: boolean;
}

const statusTone: Record<ResumeUploadStatus, "neutral" | "accent" | "violet" | "success" | "error"> = {
  queued: "neutral",
  uploading: "accent",
  parsing: "violet",
  completed: "success",
  failed: "error",
};

const statusIcon: Record<ResumeUploadStatus, React.ReactNode> = {
  queued: <Clock className="size-3" />,
  uploading: <Loader2 className="size-3 animate-spin" />,
  parsing: <Loader2 className="size-3 animate-spin" />,
  completed: <CheckCircle2 className="size-3" />,
  failed: <XCircle className="size-3" />,
};

export function ResumeUploadCard({
  upload,
  onView,
  onRemove,
  onRetry,
  isRetrying,
  isRemoving,
}: ResumeUploadCardProps) {
  const isActive = upload.status === "uploading" || upload.status === "parsing";
  const displayName = upload.candidateName ?? (isActive ? "Identifying candidate…" : "Unknown candidate");

  return (
    <div
      className={cn(
        "rounded-(--radius-lg) border bg-surface p-4 transition-colors",
        upload.status === "failed" ? "border-error-500/30" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-(--radius-md) bg-surface-raised">
            <FileText className="size-4 text-text-muted" />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-[13px] font-medium",
                upload.candidateName ? "text-text-primary" : "text-text-muted italic"
              )}
            >
              {displayName}
            </p>
            <p className="truncate text-[12px] text-text-secondary">{upload.fileName}</p>
          </div>
        </div>

        <Badge tone={statusTone[upload.status]} icon={statusIcon[upload.status]} className="shrink-0">
          {RESUME_UPLOAD_STATUS_LABELS[upload.status]}
        </Badge>
      </div>

      {isActive && (
        <div className="mt-3">
          <UploadProgress
            value={upload.status === "parsing" ? 100 : upload.progress}
            tone={upload.status === "parsing" ? "accent" : "accent"}
          />
        </div>
      )}

      {upload.status === "failed" && upload.errorMessage && (
        <p className="mt-2.5 text-[12px] text-error-400 leading-relaxed">{upload.errorMessage}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <Layers className="size-3" />
          {upload.pageCount ? `${upload.pageCount} pg` : "—"}
        </span>
        <span className="inline-flex items-center gap-1">
          <HardDrive className="size-3" />
          {formatFileSize(upload.fileSizeKb)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {formatTime(upload.uploadedAt)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
        {upload.status === "completed" && (
          <button
            onClick={() => onView(upload)}
            className="inline-flex items-center gap-1.5 rounded-(--radius-sm) px-2 py-1 text-[12px] font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <Eye className="size-3.5" />
            View
          </button>
        )}
        {upload.status === "failed" && (
          <button
            onClick={() => onRetry(upload)}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 rounded-(--radius-sm) px-2 py-1 text-[12px] font-medium text-accent-400 hover:bg-accent-600/10 transition-colors disabled:opacity-50"
          >
            <RotateCw className={cn("size-3.5", isRetrying && "animate-spin")} />
            Retry
          </button>
        )}
        <button
          onClick={() => onRemove(upload)}
          disabled={isRemoving}
          className="ml-auto inline-flex items-center gap-1.5 rounded-(--radius-sm) px-2 py-1 text-[12px] font-medium text-text-muted hover:bg-error-500/10 hover:text-error-400 transition-colors disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
          Remove
        </button>
      </div>
    </div>
  );
}
