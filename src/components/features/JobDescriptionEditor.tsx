import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../ui";
import { cn } from "../../lib/cn";
import { JD_MIN_LENGTH, JD_MAX_LENGTH } from "../../config/constants";

interface JobDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function JobDescriptionEditor({
  value,
  onChange,
  onGenerate,
  isGenerating,
  disabled,
}: JobDescriptionEditorProps) {
  const length = value.length;
  const belowMin = length < JD_MIN_LENGTH;
  const nearMax = length > JD_MAX_LENGTH * 0.9;

  return (
    <div className="flex h-full flex-col rounded-(--radius-lg) border border-border bg-surface p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-text-primary">Job description</h2>
          <p className="mt-1 text-[12.5px] text-text-secondary leading-relaxed">
            Paste the full JD. The more detail you include — skills, years of experience,
            responsibilities — the more precise the generated rubric will be.
          </p>
        </div>
      </div>

      <div className="relative flex-1 min-h-[280px]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, JD_MAX_LENGTH))}
          disabled={disabled || isGenerating}
          placeholder="e.g. We're looking for a Senior Frontend Engineer to lead development of our recruiter-facing dashboards. You'll work closely with design and AI teams to ship explainable, data-dense interfaces. Requirements: 5+ years with React and TypeScript, experience building or maintaining a design system..."
          className={cn(
            "h-full w-full resize-none rounded-(--radius-md) border border-border-strong bg-surface-raised p-4",
            "text-[13px] leading-relaxed text-text-primary placeholder:text-text-muted",
            "outline-none transition-colors focus:border-accent-500",
            "disabled:opacity-60"
          )}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            "text-[12px] tabular",
            nearMax ? "text-warning-400" : belowMin ? "text-text-muted" : "text-text-secondary"
          )}
        >
          {length.toLocaleString()} / {JD_MAX_LENGTH.toLocaleString()} characters
          {belowMin && length > 0 && (
            <span className="text-text-muted"> · min {JD_MIN_LENGTH}</span>
          )}
        </span>

        <Button
          size="md"
          variant="primary"
          onClick={onGenerate}
          isLoading={isGenerating}
          disabled={belowMin || disabled}
          icon={isGenerating ? <Loader2 className="size-4" /> : <Sparkles className="size-4" />}
          className={!isGenerating ? "shadow-(--shadow-glow-accent)" : undefined}
        >
          {isGenerating ? "Generating rubric…" : "Generate AI Rubric"}
        </Button>
      </div>

      {belowMin && length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-text-muted">
          <AlertCircle className="size-3.5 shrink-0" />
          Add {JD_MIN_LENGTH - length} more characters for an accurate rubric.
        </p>
      )}
    </div>
  );
}
