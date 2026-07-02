import { Download, MapPin, GraduationCap, Briefcase, AlertTriangle } from "lucide-react";
import type { Candidate, RiskFlag } from "../../types";
import { DECISION_LABELS, DECISION_BADGE_TONE } from "../../types";
import { Badge } from "../ui";
import { CandidateScoreBadge } from "./CandidateScoreBadge";
import { MiniScoreBar } from "./MiniScoreBar";
import { ConfidenceGauge } from "./ConfidenceGauge";
import { getConfidenceLabel } from "../../lib/scoring";
import { useToast } from "../../hooks/useToast";
import { cn } from "../../lib/cn";

interface CandidateProfileCardProps {
  candidate: Candidate;
  riskFlags: RiskFlag[];
  isLoadingRiskFlags: boolean;
}

const severityStyle: Record<RiskFlag["severity"], string> = {
  low: "border-warning-500/25 bg-warning-500/[0.06] text-warning-400",
  medium: "border-warning-500/30 bg-warning-500/[0.08] text-warning-400",
  high: "border-error-500/30 bg-error-500/[0.08] text-error-400",
};

export function CandidateProfileCard({ candidate, riskFlags, isLoadingRiskFlags }: CandidateProfileCardProps) {
  const { showToast } = useToast();

  return (
    <div className="rounded-(--radius-lg) border border-border bg-surface p-5">
      {/* Identity */}
      <div className="flex flex-col items-center text-center border-b border-border pb-5">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent-600/15 text-[18px] font-semibold text-accent-400">
          {candidate.avatarInitials}
        </div>
        <h2 className="mt-3 text-[15px] font-semibold text-text-primary">{candidate.name}</h2>
        <p className="text-[12.5px] text-text-secondary">{candidate.title}</p>
        <div className="mt-2 flex items-center gap-1 text-[11.5px] text-text-muted">
          <MapPin className="size-3" />
          {candidate.location}
        </div>
        <Badge tone={DECISION_BADGE_TONE[candidate.decision]} className="mt-3">
          {DECISION_LABELS[candidate.decision]}
        </Badge>
        <button
          onClick={() =>
            showToast("Resume download unavailable", {
              description: "This will download the original file once the backend is connected.",
              tone: "info",
            })
          }
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent-400 hover:text-accent-300 transition-colors"
        >
          <Download className="size-3.5" />
          Download Resume
        </button>
      </div>

      {/* Core facts */}
      <div className="space-y-2.5 border-b border-border py-4 text-[12.5px]">
        <div className="flex items-center gap-2 text-text-secondary">
          <Briefcase className="size-3.5 shrink-0 text-text-muted" />
          {candidate.yearsOfExperience} years of experience
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <GraduationCap className="size-3.5 shrink-0 text-text-muted" />
          {candidate.educationLevel}
        </div>
      </div>

      {/* AI match + confidence */}
      <div className="grid grid-cols-2 gap-3 border-b border-border py-4">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Overall AI Match
          </p>
          <CandidateScoreBadge score={candidate.overallScore} />
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
            AI Confidence
          </p>
          <ConfidenceGauge value={candidate.aiConfidence} label={getConfidenceLabel(candidate.aiConfidence)} />
        </div>
      </div>

      {/* Quick metrics */}
      <div className="space-y-3 border-b border-border py-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Quick metrics</p>
        <div>
          <p className="mb-1 text-[11.5px] text-text-secondary">Skills Matched</p>
          <p className="text-[12.5px] text-text-primary">{candidate.matchedSkills.length} skills</p>
        </div>
        <div>
          <p className="mb-1 text-[11.5px] text-text-secondary">Missing Skills</p>
          <p className="text-[12.5px] text-text-primary">
            {candidate.missingSkills.length > 0 ? candidate.missingSkills.join(", ") : "None"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[11.5px] text-text-secondary">Resume Quality</p>
          <MiniScoreBar value={candidate.resumeQuality} />
        </div>
        <div>
          <p className="mb-1 text-[11.5px] text-text-secondary">Experience Match</p>
          <MiniScoreBar value={candidate.experienceMatch} />
        </div>
        <div>
          <p className="mb-1 text-[11.5px] text-text-secondary">Interview Readiness</p>
          <MiniScoreBar value={candidate.interviewReadiness} />
        </div>
      </div>

      {/* Risk flags */}
      {!isLoadingRiskFlags && riskFlags.length > 0 && (
        <div className="pt-4">
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
            AI Risk Flags
          </p>
          <div className="space-y-1.5">
            {riskFlags.map((flag) => (
              <div
                key={flag.label}
                className={cn(
                  "flex items-center gap-2 rounded-(--radius-md) border px-2.5 py-1.5 text-[11.5px] font-medium",
                  severityStyle[flag.severity]
                )}
              >
                <AlertTriangle className="size-3.5 shrink-0" />
                {flag.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
