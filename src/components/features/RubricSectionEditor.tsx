import type { RubricSection, RubricSectionKey } from "../../types";
import { RUBRIC_SECTION_LABELS, RUBRIC_SECTION_PLACEHOLDERS } from "../../types";
import { TagListEditor } from "./TagListEditor";

interface RubricSectionEditorProps {
  sectionKey: RubricSectionKey;
  section: RubricSection;
  onChange: (next: RubricSection) => void;
  disabled?: boolean;
}

export function RubricSectionEditor({
  sectionKey,
  section,
  onChange,
  disabled,
}: RubricSectionEditorProps) {
  return (
    <div className="border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-medium text-text-primary">
          {RUBRIC_SECTION_LABELS[sectionKey]}
        </h3>
        <label className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            min={0}
            max={100}
            value={section.weight}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...section, weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
            }
            className="h-7 w-14 rounded-(--radius-sm) border border-border-strong bg-surface-raised text-center text-[12px] tabular text-text-primary outline-none transition-colors focus:border-accent-500 disabled:opacity-60"
          />
          <span className="text-[12px] text-text-muted">% weight</span>
        </label>
      </div>

      <TagListEditor
        items={section.items}
        onChange={(items) => onChange({ ...section, items })}
        placeholder={RUBRIC_SECTION_PLACEHOLDERS[sectionKey]}
        disabled={disabled}
      />
    </div>
  );
}
