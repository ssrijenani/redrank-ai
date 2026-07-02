import type { Job } from "../../types";
import { cn } from "../../lib/cn";

export interface JobMetaFormValue {
  title: string;
  location: string;
  employmentType: Job["employmentType"];
}

interface JobMetaFormProps {
  value: JobMetaFormValue;
  onChange: (value: JobMetaFormValue) => void;
  disabled?: boolean;
}

const employmentTypes: Job["employmentType"][] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
];

export function JobMetaForm({ value, onChange, disabled }: JobMetaFormProps) {
  const inputClass = cn(
    "h-9 w-full rounded-(--radius-md) border border-border-strong bg-surface-raised px-3",
    "text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors",
    "focus:border-accent-500 disabled:opacity-60"
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="job-title" className="mb-1.5 block text-[12px] font-medium text-text-secondary">
          Job title
        </label>
        <input
          id="job-title"
          value={value.title}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="e.g. Senior Frontend Engineer"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="job-location" className="mb-1.5 block text-[12px] font-medium text-text-secondary">
          Location
        </label>
        <input
          id="job-location"
          value={value.location}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
          placeholder="e.g. Remote"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="job-type" className="mb-1.5 block text-[12px] font-medium text-text-secondary">
          Employment type
        </label>
        <select
          id="job-type"
          value={value.employmentType}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...value, employmentType: e.target.value as Job["employmentType"] })
          }
          className={cn(inputClass, "appearance-none cursor-pointer")}
        >
          {employmentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
