import { useState, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "../../lib/cn";

interface TagListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagListEditor({ items, onChange, placeholder, disabled }: TagListEditorProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && items.length > 0) {
      onChange(items.slice(0, -1));
    }
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-(--radius-md) border border-border-strong bg-surface-raised p-2.5",
        "focus-within:border-accent-500 transition-colors",
        disabled && "opacity-60"
      )}
    >
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] font-medium text-text-primary"
        >
          {item}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${item}`}
              className="text-text-muted hover:text-error-400 transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <div className="flex min-w-[120px] flex-1 items-center gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitDraft}
            placeholder={items.length === 0 ? placeholder : "Add another…"}
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-text-primary placeholder:text-text-muted outline-none py-0.5"
          />
          {draft.trim() && (
            <button
              type="button"
              onClick={commitDraft}
              aria-label="Add item"
              className="shrink-0 text-accent-400 hover:text-accent-300"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
