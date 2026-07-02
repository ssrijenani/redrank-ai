import { X } from "lucide-react";
import type { AnalyticsFilters as AnalyticsFiltersState } from "../../types";

interface AnalyticsFiltersProps {
  value: AnalyticsFiltersState;
  onChange: (next: AnalyticsFiltersState) => void;
  jobs: { id: string; title: string }[];
  departments: string[];
  recruiters: string[];
}

const selectClass =
  "h-9 rounded-(--radius-md) border border-border-strong bg-surface-raised px-2.5 text-[12.5px] text-text-primary outline-none transition-colors focus:border-accent-500 cursor-pointer";

export function AnalyticsFilters({ value, onChange, jobs, departments, recruiters }: AnalyticsFiltersProps) {
  function set<K extends keyof AnalyticsFiltersState>(key: K, next: AnalyticsFiltersState[K]) {
    onChange({ ...value, [key]: next || undefined });
  }

  const hasActiveFilters = Boolean(
    value.jobId || value.department || value.recruiter || value.dateFrom || value.dateTo
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <select
        value={value.jobId ?? ""}
        onChange={(e) => set("jobId", e.target.value)}
        className={selectClass}
        aria-label="Filter by job"
      >
        <option value="">All Jobs</option>
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.title}
          </option>
        ))}
      </select>

      <select
        value={value.department ?? ""}
        onChange={(e) => set("department", e.target.value)}
        className={selectClass}
        aria-label="Filter by department"
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={value.recruiter ?? ""}
        onChange={(e) => set("recruiter", e.target.value)}
        className={selectClass}
        aria-label="Filter by recruiter"
      >
        <option value="">All Recruiters</option>
        {recruiters.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={value.dateFrom ?? ""}
          onChange={(e) => set("dateFrom", e.target.value)}
          className={selectClass}
          aria-label="Date from"
        />
        <span className="text-[11.5px] text-text-muted">to</span>
        <input
          type="date"
          value={value.dateTo ?? ""}
          onChange={(e) => set("dateTo", e.target.value)}
          className={selectClass}
          aria-label="Date to"
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => onChange({})}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-text-muted hover:text-error-400 transition-colors"
        >
          <X className="size-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
