import { Sparkles, Save, Loader2 } from "lucide-react";
import type { Rubric, RubricSection, RubricSectionKey } from "../../types";
import { RUBRIC_SECTION_ORDER } from "../../types";
import { Badge, Button } from "../ui";
import { RubricSectionEditor } from "./RubricSectionEditor";
import { RubricWeightSummary } from "./RubricWeightSummary";
import { JobMetaForm, type JobMetaFormValue } from "./JobMetaForm";

interface RubricPanelProps {
  rubric: Rubric;
  onSectionChange: (key: RubricSectionKey, section: RubricSection) => void;
  meta: JobMetaFormValue;
  onMetaChange: (meta: JobMetaFormValue) => void;
  onSave: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

export function RubricPanel({
  rubric,
  onSectionChange,
  meta,
  onMetaChange,
  onSave,
  isSaving,
  isSaved,
}: RubricPanelProps) {
  const totalWeight = RUBRIC_SECTION_ORDER.reduce((sum, key) => sum + rubric[key].weight, 0);
  const canSave = meta.title.trim().length > 0 && meta.location.trim().length > 0 && !isSaved;

  return (
    <div className="flex h-full flex-col rounded-(--radius-lg) border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-text-primary">Hiring rubric</h2>
          <p className="mt-1 text-[12.5px] text-text-secondary leading-relaxed">
            Edit anything below before saving — the AI draft is a starting point, not a final answer.
          </p>
        </div>
        <Badge tone="violet" icon={<Sparkles className="size-3" />} className="shrink-0">
          AI Generated — Review Before Saving
        </Badge>
      </div>

      <div className="mb-4">
        <JobMetaForm value={meta} onChange={onMetaChange} disabled={isSaved} />
      </div>

      <div className="mb-4">
        <RubricWeightSummary total={totalWeight} />
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {RUBRIC_SECTION_ORDER.map((key) => (
          <RubricSectionEditor
            key={key}
            sectionKey={key}
            section={rubric[key]}
            onChange={(section) => onSectionChange(key, section)}
            disabled={isSaved}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button
          variant="primary"
          onClick={onSave}
          isLoading={isSaving}
          disabled={!canSave || isSaving}
          icon={isSaving ? <Loader2 className="size-4" /> : <Save className="size-4" />}
        >
          {isSaved ? "Job saved" : isSaving ? "Saving…" : "Save Job"}
        </Button>
      </div>
    </div>
  );
}
