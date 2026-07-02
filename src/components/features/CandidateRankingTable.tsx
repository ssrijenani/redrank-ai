import type { Candidate } from "../../types";
import { CandidateRow } from "./CandidateRow";

interface CandidateRankingTableProps {
  candidates: Candidate[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onView: (candidate: Candidate) => void;
  onShortlist: (candidate: Candidate) => void;
  onReject: (candidate: Candidate) => void;
  onAddNote: (candidate: Candidate, note: string) => void;
  pendingActionIds: Set<string>;
}

const headers = [
  { label: "", width: "w-10" },
  { label: "Rank", width: "w-10" },
  { label: "Candidate", width: "min-w-[220px]" },
  { label: "AI Match", width: "" },
  { label: "Skills Match", width: "" },
  { label: "Experience Match", width: "" },
  { label: "Education", width: "" },
  { label: "Resume Quality", width: "" },
  { label: "AI Confidence", width: "" },
  { label: "Status", width: "" },
  { label: "Actions", width: "" },
];

export function CandidateRankingTable({
  candidates,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onShortlist,
  onReject,
  onAddNote,
  pendingActionIds,
}: CandidateRankingTableProps) {
  const allSelected = candidates.length > 0 && candidates.every((c) => selectedIds.has(c.id));

  return (
    <div className="overflow-x-auto rounded-(--radius-lg) border border-border">
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised/50">
            <th className="w-10 px-3 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                aria-label="Select all candidates"
                className="size-3.5 rounded-sm accent-[var(--color-accent-500)]"
              />
            </th>
            {headers.slice(1).map((h) => (
              <th
                key={h.label}
                className="px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-text-muted"
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              rank={i + 1}
              isSelected={selectedIds.has(c.id)}
              onToggleSelect={() => onToggleSelect(c.id)}
              onView={() => onView(c)}
              onShortlist={() => onShortlist(c)}
              onReject={() => onReject(c)}
              onAddNote={(note) => onAddNote(c, note)}
              isShortlisting={pendingActionIds.has(`shortlist-${c.id}`)}
              isRejecting={pendingActionIds.has(`reject-${c.id}`)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
