import { CheckCircle2, XCircle, Download, X, Loader2 } from "lucide-react";
import { Button } from "../ui";

interface BulkActionsBarProps {
  selectedCount: number;
  onShortlistSelected: () => void;
  onRejectSelected: () => void;
  onExportSelected: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onShortlistSelected,
  onRejectSelected,
  onExportSelected,
  onClearSelection,
  isProcessing,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-[7.5rem] z-10 mb-3 flex flex-wrap items-center gap-3 rounded-(--radius-lg) border border-accent-600/30 bg-accent-600/[0.08] px-4 py-2.5">
      <button
        onClick={onClearSelection}
        aria-label="Clear selection"
        className="flex size-5 items-center justify-center rounded-full text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
      >
        <X className="size-3.5" />
      </button>
      <span className="text-[12.5px] font-medium text-text-primary">
        {selectedCount} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon={isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
          onClick={onShortlistSelected}
          disabled={isProcessing}
        >
          Shortlist Selected
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
          onClick={onRejectSelected}
          disabled={isProcessing}
        >
          Reject Selected
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<Download className="size-3.5" />}
          onClick={onExportSelected}
        >
          Export Selected
        </Button>
      </div>
    </div>
  );
}
