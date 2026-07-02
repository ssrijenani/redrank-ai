import type { ResumeUpload } from "../../types";
import { ResumeUploadCard } from "./ResumeUploadCard";

interface ResumeUploadListProps {
  uploads: ResumeUpload[];
  onView: (upload: ResumeUpload) => void;
  onRemove: (upload: ResumeUpload) => void;
  onRetry: (upload: ResumeUpload) => void;
  pendingActionIds: Set<string>;
}

export function ResumeUploadList({
  uploads,
  onView,
  onRemove,
  onRetry,
  pendingActionIds,
}: ResumeUploadListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {uploads.map((upload) => (
        <ResumeUploadCard
          key={upload.id}
          upload={upload}
          onView={onView}
          onRemove={onRemove}
          onRetry={onRetry}
          isRetrying={pendingActionIds.has(`retry-${upload.id}`)}
          isRemoving={pendingActionIds.has(`remove-${upload.id}`)}
        />
      ))}
    </div>
  );
}
