import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  X,
  Check,
  XCircle,
  Download,
  ArrowUpRight,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { Candidate } from "../../types";
import { DECISION_LABELS, DECISION_BADGE_TONE } from "../../types";
import { Badge, Button } from "../ui";
import { CandidateScoreBadge } from "./CandidateScoreBadge";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { getConfidenceLabel } from "../../lib/scoring";
import { useToast } from "../../hooks/useToast";

interface CandidateDrawerProps {
  candidate: Candidate | null;
  jobId: string;
  onClose: () => void;
}

export function CandidateDrawer({ candidate, jobId, onClose }: CandidateDrawerProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (candidate) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [candidate, onClose]);

  return createPortal(
    <AnimatePresence>
      {candidate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${candidate.name} details`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-(--shadow-lg)"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-600/15 text-[13px] font-semibold text-accent-400">
                  {candidate.avatarInitials}
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-text-primary">{candidate.name}</h2>
                  <p className="text-[12.5px] text-text-secondary">{candidate.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-text-muted">{candidate.location}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-(--radius-sm) p-1 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Summary */}
              <div>
                <Badge tone={DECISION_BADGE_TONE[candidate.decision]}>
                  {DECISION_LABELS[candidate.decision]}
                </Badge>
                <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">{candidate.summary}</p>
              </div>

              {/* Overall AI Match + Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-(--radius-lg) border border-border bg-surface-raised p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">
                    Overall AI Match
                  </p>
                  <CandidateScoreBadge score={candidate.overallScore} />
                </div>
                <div className="rounded-(--radius-lg) border border-border bg-surface-raised p-3.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">
                    AI Confidence
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <ShieldCheck className="size-3.5 text-accent-400" />
                    <span className="text-[16px] font-semibold tabular text-text-primary">
                      {candidate.aiConfidence}%
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {getConfidenceLabel(candidate.aiConfidence)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skill breakdown radar */}
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-text-primary">Skill breakdown</h3>
                <ScoreBreakdown data={candidate.scoreBreakdown} />
              </div>

              {/* Why AI ranked this candidate */}
              <div className="rounded-(--radius-lg) border border-violet-500/25 bg-violet-500/[0.06] p-4">
                <h3 className="mb-3 text-[13px] font-semibold text-text-primary">
                  Why AI ranked this candidate
                </h3>
                <ul className="space-y-1.5">
                  {candidate.matchedSkills.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                      <Check className="size-3.5 shrink-0 text-success-400" />
                      {s}
                    </li>
                  ))}
                </ul>
                {candidate.missingSkills.length > 0 && (
                  <>
                    <p className="mt-3 mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                      Missing
                    </p>
                    <ul className="space-y-1.5">
                      {candidate.missingSkills.map((s) => (
                        <li key={s} className="flex items-center gap-2 text-[12.5px] text-text-secondary">
                          <XCircle className="size-3.5 shrink-0 text-error-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-violet-500/20 pt-3">
                  <span className="text-[12px] text-text-secondary">Overall Match</span>
                  <span className="text-[15px] font-semibold tabular text-violet-400">
                    {candidate.overallScore}%
                  </span>
                </div>
              </div>

              {/* Strengths / weaknesses */}
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-text-primary">Strengths</h3>
                <ul className="space-y-1.5">
                  {candidate.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-text-secondary">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {candidate.weaknesses.length > 0 && (
                <div>
                  <h3 className="mb-2 text-[13px] font-semibold text-text-primary">Resume highlights to probe</h3>
                  <ul className="space-y-1.5">
                    {candidate.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-text-secondary">
                        <XCircle className="mt-0.5 size-3.5 shrink-0 text-error-400" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resume preview placeholder */}
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-text-primary">Resume preview</h3>
                <div className="flex items-center gap-3 rounded-(--radius-lg) border border-border bg-surface-raised p-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-(--radius-md) bg-surface">
                    <FileText className="size-4 text-text-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-text-primary">
                      {candidate.name.replace(/\s+/g, "_")}_Resume.pdf
                    </p>
                    <p className="text-[11.5px] text-text-muted">
                      Full document preview available once the backend is connected.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {candidate.notes.length > 0 && (
                <div>
                  <h3 className="mb-2 text-[13px] font-semibold text-text-primary">Recruiter notes</h3>
                  <ul className="space-y-2">
                    {candidate.notes.map((n, i) => (
                      <li
                        key={i}
                        className="rounded-(--radius-md) border border-border bg-surface-raised p-2.5 text-[12px] text-text-secondary leading-relaxed"
                      >
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="space-y-2 border-t border-border p-5">
              <Button
                className="w-full"
                variant="primary"
                icon={<ArrowUpRight className="size-4" />}
                iconPosition="right"
                onClick={() => navigate(`/jobs/${jobId}/candidates/${candidate.id}`)}
              >
                Open Decision Workspace
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                icon={<Download className="size-4" />}
                onClick={() =>
                  showToast("Resume download unavailable", {
                    description: "This will download the original file once the backend is connected.",
                    tone: "info",
                  })
                }
              >
                Download Resume
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
