import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { UploadCloud, FileText, FileType2 } from "lucide-react";
import { cn } from "../../lib/cn";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_UPLOAD_FILES,
  SUPPORTED_FILE_EXTENSIONS,
  SUPPORTED_FILE_TYPES,
} from "../../config/constants";

interface RejectedFile {
  fileName: string;
  reason: string;
}

interface ResumeDropzoneProps {
  /** How many upload slots remain before hitting MAX_UPLOAD_FILES for this job. */
  remainingSlots: number;
  onFilesAccepted: (files: File[]) => void;
  onFilesRejected: (rejected: RejectedFile[]) => void;
  disabled?: boolean;
}

function isSupportedType(file: File): boolean {
  if (SUPPORTED_FILE_TYPES.includes(file.type as (typeof SUPPORTED_FILE_TYPES)[number])) {
    return true;
  }
  // Some browsers/OSes report an empty or generic mime type for .docx — fall back to extension.
  const lower = file.name.toLowerCase();
  return SUPPORTED_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function ResumeDropzone({
  remainingSlots,
  onFilesAccepted,
  onFilesRejected,
  disabled,
}: ResumeDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) return;
      const files = Array.from(fileList);
      const accepted: File[] = [];
      const rejected: RejectedFile[] = [];

      for (const file of files) {
        if (accepted.length >= remainingSlots) {
          rejected.push({ fileName: file.name, reason: `Upload limit of ${MAX_UPLOAD_FILES} files reached.` });
          continue;
        }
        if (!isSupportedType(file)) {
          rejected.push({ fileName: file.name, reason: "Unsupported file type. Use PDF or DOCX." });
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          rejected.push({ fileName: file.name, reason: `File exceeds ${MAX_FILE_SIZE_MB}MB limit.` });
          continue;
        }
        accepted.push(file);
      }

      if (accepted.length > 0) onFilesAccepted(accepted);
      if (rejected.length > 0) onFilesRejected(rejected);
    },
    [remainingSlots, disabled, onFilesAccepted, onFilesRejected]
  );

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    e.target.value = ""; // allow re-selecting the same file
  }

  const atCapacity = remainingSlots <= 0;

  return (
    <div
      role="button"
      tabIndex={disabled || atCapacity ? -1 : 0}
      onClick={() => !disabled && !atCapacity && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled && !atCapacity) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !atCapacity) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      aria-disabled={disabled || atCapacity}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-(--radius-xl) border-2 border-dashed px-6 py-14 text-center transition-colors duration-(--duration-base)",
        disabled || atCapacity
          ? "cursor-not-allowed border-border bg-surface-raised/40 opacity-60"
          : isDragging
            ? "cursor-pointer border-accent-500 bg-accent-600/5"
            : "cursor-pointer border-border-strong bg-surface hover:border-accent-500/60 hover:bg-surface-hover"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={SUPPORTED_FILE_EXTENSIONS.join(",")}
        onChange={handleInputChange}
        disabled={disabled || atCapacity}
        className="sr-only"
        aria-label="Upload resumes"
      />

      {/* Layered icon illustration — no external image assets needed */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-accent-600/10" />
        <div className="absolute -left-1 -top-1 flex size-8 items-center justify-center rounded-lg border border-border bg-surface-raised rotate-[-8deg]">
          <FileText className="size-4 text-text-muted" />
        </div>
        <div className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-lg border border-border bg-surface-raised rotate-[10deg]">
          <FileType2 className="size-4 text-text-muted" />
        </div>
        <div className="relative flex size-11 items-center justify-center rounded-xl bg-accent-600 shadow-(--shadow-glow-accent)">
          <UploadCloud className="size-5 text-white" />
        </div>
      </div>

      <div>
        <p className="text-[14px] font-medium text-text-primary">
          {atCapacity ? "Upload limit reached" : "Drag & drop resumes here"}
        </p>
        <p className="mt-1 text-[12.5px] text-text-secondary">
          {atCapacity ? (
            `You've reached the ${MAX_UPLOAD_FILES}-file limit for this job.`
          ) : (
            <>
              or <span className="font-medium text-accent-400">click to browse</span>
            </>
          )}
        </p>
      </div>

      {!atCapacity && (
        <p className="text-[11.5px] text-text-muted">
          PDF or DOCX · up to {MAX_FILE_SIZE_MB}MB each · {remainingSlots} of {MAX_UPLOAD_FILES} slots left
        </p>
      )}
    </div>
  );
}
