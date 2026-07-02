/**
 * A resume upload progresses through a fixed lifecycle, driven entirely by
 * services/api.ts (queued -> uploading -> parsing -> completed | failed).
 * Pages only ever read this shape via fetchResumeUploads / initiateResumeUpload —
 * none of the timing/progression logic lives in the component layer.
 */
export type ResumeUploadStatus = "queued" | "uploading" | "parsing" | "completed" | "failed";

export interface ResumeUpload {
  id: string;
  jobId: string;
  fileName: string;
  fileSizeKb: number;
  /** 0-100. Meaningful during "uploading"; treated as complete for later stages. */
  progress: number;
  status: ResumeUploadStatus;
  /** Populated once parsing completes successfully. */
  candidateName: string | null;
  /** Mocked page count, populated once parsing completes successfully. */
  pageCount: number | null;
  uploadedAt: string;
  errorMessage: string | null;
}

export const RESUME_UPLOAD_STATUS_LABELS: Record<ResumeUploadStatus, string> = {
  queued: "Queued",
  uploading: "Uploading",
  parsing: "Parsing",
  completed: "Completed",
  failed: "Failed",
};

export const RESUME_UPLOAD_TERMINAL_STATUSES: ResumeUploadStatus[] = ["completed", "failed"];
