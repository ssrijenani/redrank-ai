import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { RANKING_SORT_OPTIONS, type RankingSortOption } from "../../config/constants";

export interface CandidateFilterState {
  search: string;
  minScore: number;
  minExperience: number;
  educationLevel: string;
  requiredSkills: string[];
  sortBy: RankingSortOption;
}

export const DEFAULT_FILTER_STATE: CandidateFilterState = {
  search: "",
  minScore: 0,
  minExperience: 0,
  educationLevel: "",
  requiredSkills: [],
  sortBy: "aiMatch",
};

interface CandidateFiltersProps {
  value: CandidateFilterState;
  onChange: (next: CandidateFilterState) => void;
  availableSkills: string[];
  availableEducationLevels: string[];
  resultCount: number;
}

const selectClass =
  "h-9 rounded-(--radius-md) border border-border-strong bg-surface-raised px-2.5 text-[12.5px] text-text-primary outline-none transition-colors focus:border-accent-500 cursor-pointer";

export function CandidateFilters({
  value,
  onChange,
  availableSkills,
  availableEducationLevels,
  resultCount,
}: CandidateFiltersProps) {
  function set<K extends keyof CandidateFilterState>(key: K, next: CandidateFilterState[K]) {
    onChange({ ...value, [key]: next });
  }

  function toggleSkill(skill: string) {
    const has = value.requiredSkills.includes(skill);
    set(
      "requiredSkills",
      has ? value.requiredSkills.filter((s) => s !== skill) : [...value.requiredSkills, skill]
    );
  }

  const hasActiveFilters =
    value.search || value.minScore > 0 || value.minExperience > 0 || value.educationLevel || value.requiredSkills.length > 0;

  return (
    <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={value.search}
              onChange={(e) => set("search", e.target.value)}
              placeholder="Search candidates by name or title…"
              className="h-9 w-full rounded-(--radius-md) border border-border-strong bg-surface-raised pl-8 pr-3 text-[12.5px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-500"
            />
          </div>

          <select
            value={value.minScore}
            onChange={(e) => set("minScore", Number(e.target.value))}
            className={selectClass}
            aria-label="Minimum AI score"
          >
            <option value={0}>Any AI score</option>
            <option value={60}>60%+ AI score</option>
            <option value={75}>75%+ AI score</option>
            <option value={90}>90%+ AI score</option>
          </select>

          <select
            value={value.minExperience}
            onChange={(e) => set("minExperience", Number(e.target.value))}
            className={selectClass}
            aria-label="Minimum experience match"
          >
            <option value={0}>Any experience</option>
            <option value={60}>60%+ experience match</option>
            <option value={75}>75%+ experience match</option>
            <option value={90}>90%+ experience match</option>
          </select>

          <select
            value={value.educationLevel}
            onChange={(e) => set("educationLevel", e.target.value)}
            className={selectClass}
            aria-label="Education"
          >
            <option value="">Any education</option>
            {availableEducationLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <SlidersHorizontal className="size-3.5 text-text-muted" />
            <select
              value={value.sortBy}
              onChange={(e) => set("sortBy", e.target.value as RankingSortOption)}
              className={selectClass}
              aria-label="Sort by"
            >
              {RANKING_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {availableSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11.5px] text-text-muted mr-0.5">Skills:</span>
            {availableSkills.map((skill) => {
              const active = value.requiredSkills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                    active
                      ? "border-accent-500 bg-accent-600/15 text-accent-400"
                      : "border-border-strong bg-surface-raised text-text-secondary hover:border-border-strong hover:text-text-primary"
                  )}
                >
                  {skill}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                onClick={() => onChange(DEFAULT_FILTER_STATE)}
                className="ml-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-text-muted hover:text-error-400 transition-colors"
              >
                <X className="size-3" />
                Clear filters
              </button>
            )}
            <span className="ml-auto text-[11.5px] tabular text-text-muted">
              {resultCount} candidate{resultCount === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
