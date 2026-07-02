import { Check, X as XIcon } from "lucide-react";
import type { Candidate } from "../../types";
import { DECISION_LABELS, DECISION_BADGE_TONE } from "../../types";
import { Badge } from "../ui";
import { CandidateScoreBadge } from "./CandidateScoreBadge";
import { MiniScoreBar } from "./MiniScoreBar";
import { CandidateActions } from "./CandidateActions";
import { getConfidenceLabel } from "../../lib/scoring";
import { cn } from "../../lib/cn";

interface CandidateRowProps {
  candidate: Candidate;
  rank: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onShortlist: () => void;
  onReject: () => void;
  onAddNote: (note: string) => void;
  isShortlisting?: boolean;
  isRejecting?: boolean;
}

export function CandidateRow({
  candidate,
  rank,
  isSelected,
  onToggleSelect,
  onView,
  onShortlist,
  onReject,
  onAddNote,
  isShortlisting,
  isRejecting,
}: CandidateRowProps) {
  const previewMatched = candidate.matchedSkills.slice(0, 3);
  const previewMissing = candidate.missingSkills.slice(0, 1);

  return (
    <tr
      className={cn(
        "border-b border-border last:border-b-0 transition-colors",
        isSelected ? "bg-accent-600/[0.06]" : "hover:bg-surface-hover"
      )}
    >
      <td className="w-10 px-3 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label={`Select ${candidate.name}`}
          className="size-3.5 rounded-sm accent-[var(--color-accent-500)]"
        />
      </td>

      <td className="w-10 px-2 py-3 text-[12.5px] tabular text-text-muted">#{rank}</td>

      <td className="min-w-[220px] px-3 py-3">
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-600/15 text-[11px] font-semibold text-accent-400">
            {candidate.avatarInitials}
          </div>
          <div className="min-w-0">
            <button
              onClick={onView}
              className="truncate text-left text-[13px] font-medium text-text-primary hover:text-accent-400 transition-colors"
            >
              {candidate.name}
            </button>
            <p className="truncate text-[11.5px] text-text-secondary">{candidate.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
              {previewMatched.map((s) => (
                <span key={s} className="inline-flex items-center gap-0.5 text-success-400">
                  <Check className="size-2.5" />
                  {s}
                </span>
              ))}
              {previewMissing.map((s) => (
                <span key={s} className="inline-flex items-center gap-0.5 text-error-400">
                  <XIcon className="size-2.5" />
                  {s}
                </span>
              ))}
            </p>
          </div>
        </div>
      </td>

      <td className="px-3 py-3">
        <CandidateScoreBadge score={candidate.overallScore} />
      </td>

      <td className="px-3 py-3">
        <MiniScoreBar value={candidate.skillMatch} />
      </td>

      <td className="px-3 py-3">
        <MiniScoreBar value={candidate.experienceMatch} />
      </td>

      <td className="px-3 py-3 text-[12px] text-text-secondary max-w-[140px] truncate">
        {candidate.educationLevel}
      </td>

      <td className="px-3 py-3">
        <MiniScoreBar value={candidate.resumeQuality} />
      </td>

      <td className="px-3 py-3">
        <span className="text-[12.5px] tabular text-text-primary">{candidate.aiConfidence}%</span>
        <p className="text-[11px] text-text-muted">{getConfidenceLabel(candidate.aiConfidence)}</p>
      </td>

      <td className="px-3 py-3">
        <Badge tone={DECISION_BADGE_TONE[candidate.decision]}>{DECISION_LABELS[candidate.decision]}</Badge>
      </td>

      <td className="px-3 py-3">
        <CandidateActions
          onView={onView}
          onShortlist={onShortlist}
          onReject={onReject}
          onAddNote={onAddNote}
          isShortlisting={isShortlisting}
          isRejecting={isRejecting}
        />
      </td>
    </tr>
  );
}
