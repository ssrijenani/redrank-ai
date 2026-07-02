import { UploadProgress } from "./UploadProgress";

interface UploadSummaryProps {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
}

export function UploadSummary({ total, completed, failed, inProgress }: UploadSummaryProps) {
  const settled = completed + failed;
  const percent = total > 0 ? (settled / total) * 100 : 0;

  return (
    <div className="rounded-(--radius-lg) border border-border bg-surface p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[13px] font-medium text-text-primary">
          <span className="tabular">{settled}</span> / <span className="tabular">{total}</span> processed
        </span>
        <span className="text-[12px] text-text-secondary tabular">
          {inProgress > 0 ? `${inProgress} in progress` : failed > 0 ? `${failed} failed` : "All done"}
        </span>
      </div>
      <UploadProgress value={percent} size="md" tone={failed > 0 ? "accent" : "success"} />
    </div>
  );
}
