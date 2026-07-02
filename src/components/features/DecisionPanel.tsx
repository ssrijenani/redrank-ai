import { CheckCircle2, PauseCircle, XCircle, CalendarClock, Loader2 } from "lucide-react";
import type { DecisionAction, DecisionReason, InterviewAssignment, InterviewPriority } from "../../types";
import { DECISION_REASONS } from "../../types";
import { Button } from "../ui";
import { cn } from "../../lib/cn";

interface DecisionPanelProps {
  selectedAction: DecisionAction | null;
  onSelectAction: (action: DecisionAction) => void;
  reason: DecisionReason;
  onReasonChange: (reason: DecisionReason) => void;
  note: string;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;

  interviewer: string;
  onInterviewerChange: (v: string) => void;
  interviewDate: string;
  onInterviewDateChange: (v: string) => void;
  priority: InterviewPriority;
  onPriorityChange: (v: InterviewPriority) => void;
  onAssignInterview: () => void;
  isAssigning: boolean;
  currentAssignment: InterviewAssignment | null;
}

const actionConfig: { action: DecisionAction; label: string; icon: typeof CheckCircle2; tone: string }[] = [
  { action: "approved", label: "Approve", icon: CheckCircle2, tone: "success" },
  { action: "hold", label: "Hold", icon: PauseCircle, tone: "warning" },
  { action: "rejected", label: "Reject", icon: XCircle, tone: "error" },
];

const toneActive: Record<string, string> = {
  success: "border-success-500 bg-success-500/15 text-success-400",
  warning: "border-warning-500 bg-warning-500/15 text-warning-400",
  error: "border-error-500 bg-error-500/15 text-error-400",
};

const inputClass =
  "h-9 w-full rounded-(--radius-md) border border-border-strong bg-surface-raised px-3 text-[12.5px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-500";

export function DecisionPanel({
  selectedAction,
  onSelectAction,
  reason,
  onReasonChange,
  note,
  onNoteChange,
  onSubmit,
  isSubmitting,
  interviewer,
  onInterviewerChange,
  interviewDate,
  onInterviewDateChange,
  priority,
  onPriorityChange,
  onAssignInterview,
  isAssigning,
  currentAssignment,
}: DecisionPanelProps) {
  return (
    <div className="rounded-(--radius-lg) border border-border bg-surface p-5">
      <h3 className="mb-3 text-[13px] font-semibold text-text-primary">Recruiter Decision</h3>

      <div className="grid grid-cols-3 gap-2">
        {actionConfig.map(({ action, label, icon: Icon, tone }) => (
          <button
            key={action}
            onClick={() => onSelectAction(action)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-(--radius-md) border px-2 py-2.5 text-[12px] font-medium transition-colors",
              selectedAction === action
                ? toneActive[tone]
                : "border-border-strong bg-surface-raised text-text-secondary hover:border-text-muted"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[11.5px] font-medium text-text-secondary" htmlFor="decision-reason">
          Decision Reason
        </label>
        <select
          id="decision-reason"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value as DecisionReason)}
          className={cn(inputClass, "cursor-pointer")}
        >
          {DECISION_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[11.5px] font-medium text-text-secondary" htmlFor="recruiter-notes">
          Recruiter Notes
        </label>
        <textarea
          id="recruiter-notes"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={4}
          placeholder="Add context for this decision…"
          className="w-full resize-none rounded-(--radius-md) border border-border-strong bg-surface-raised p-3 text-[12.5px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-500"
        />
      </div>

      <Button
        className="mt-4 w-full"
        variant="primary"
        disabled={!selectedAction || isSubmitting}
        isLoading={isSubmitting}
        onClick={onSubmit}
      >
        Record Decision
      </Button>

      {/* Interview assignment */}
      <div className="mt-6 border-t border-border pt-5">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="size-3.5 text-text-muted" />
          <h3 className="text-[13px] font-semibold text-text-primary">Interview Assignment</h3>
        </div>

        {currentAssignment && (
          <p className="mb-3 text-[11.5px] text-text-secondary">
            Currently assigned to <span className="text-text-primary font-medium">{currentAssignment.interviewer}</span>
            {" · "}
            {currentAssignment.priority} priority
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11.5px] font-medium text-text-secondary" htmlFor="interviewer">
              Assign Interviewer
            </label>
            <input
              id="interviewer"
              value={interviewer}
              onChange={(e) => onInterviewerChange(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-text-secondary" htmlFor="interview-date">
                Interview Date
              </label>
              <input
                id="interview-date"
                type="date"
                value={interviewDate}
                onChange={(e) => onInterviewDateChange(e.target.value)}
                className={cn(inputClass, "cursor-pointer")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-text-secondary" htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => onPriorityChange(e.target.value as InterviewPriority)}
                className={cn(inputClass, "cursor-pointer capitalize")}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            disabled={!interviewer.trim() || !interviewDate || isAssigning}
            isLoading={isAssigning}
            icon={isAssigning ? <Loader2 className="size-3.5" /> : undefined}
            onClick={onAssignInterview}
          >
            {currentAssignment ? "Update Assignment" : "Assign Interview"}
          </Button>
        </div>
      </div>
    </div>
  );
}
