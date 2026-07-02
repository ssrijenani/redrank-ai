import type { SkillHeatmapRow } from "../../types";
import { cn } from "../../lib/cn";

interface SkillHeatmapProps {
  data: SkillHeatmapRow[];
}

function heatColor(coverage: number): string {
  if (coverage >= 75) return "bg-accent-600/70";
  if (coverage >= 50) return "bg-accent-600/45";
  if (coverage >= 25) return "bg-accent-600/25";
  if (coverage > 0) return "bg-accent-600/10";
  return "bg-surface-raised";
}

export function SkillHeatmap({ data }: SkillHeatmapProps) {
  if (data.length === 0) {
    return <p className="text-[12px] text-text-muted">Not enough data to build a skill heatmap yet.</p>;
  }

  const jobTitles = data[0]?.jobs.map((j) => j.jobTitle) ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-[11.5px]">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left font-medium text-text-muted">Skill</th>
            {jobTitles.map((title) => (
              <th key={title} className="px-2 py-2 text-center font-medium text-text-muted">
                <span className="line-clamp-2 leading-tight">{title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.skill} className="border-t border-border">
              <td className="px-2 py-2 font-medium text-text-primary whitespace-nowrap">{row.skill}</td>
              {row.jobs.map((j) => (
                <td key={j.jobTitle} className="px-2 py-2 text-center">
                  <span
                    className={cn(
                      "inline-flex h-7 w-12 items-center justify-center rounded-(--radius-sm) tabular text-text-primary",
                      heatColor(j.coverage)
                    )}
                  >
                    {j.coverage}%
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
