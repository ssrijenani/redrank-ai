import { useState } from "react";
import { Eye, CheckCircle2, XCircle, MessageSquarePlus, Loader2 } from "lucide-react";
import { Button, Dialog } from "../ui";
import { cn } from "../../lib/cn";

interface CandidateActionsProps {
  onView: () => void;
  onShortlist: () => void;
  onReject: () => void;
  onAddNote: (note: string) => void;
  isShortlisting?: boolean;
  isRejecting?: boolean;
}

export function CandidateActions({
  onView,
  onShortlist,
  onReject,
  onAddNote,
  isShortlisting,
  isRejecting,
}: CandidateActionsProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  function submitNote() {
    if (noteDraft.trim()) {
      onAddNote(noteDraft.trim());
      setNoteDraft("");
    }
    setNoteOpen(false);
  }

  const iconBtn = "flex size-7 items-center justify-center rounded-(--radius-sm) transition-colors";

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          title="View Details"
          aria-label="View Details"
          onClick={onView}
          className={cn(iconBtn, "text-text-secondary hover:bg-surface-hover hover:text-text-primary")}
        >
          <Eye className="size-3.5" />
        </button>
        <button
          title="Shortlist"
          aria-label="Shortlist"
          onClick={onShortlist}
          disabled={isShortlisting}
          className={cn(iconBtn, "text-text-secondary hover:bg-success-500/10 hover:text-success-400 disabled:opacity-50")}
        >
          {isShortlisting ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
        </button>
        <button
          title="Reject"
          aria-label="Reject"
          onClick={onReject}
          disabled={isRejecting}
          className={cn(iconBtn, "text-text-secondary hover:bg-error-500/10 hover:text-error-400 disabled:opacity-50")}
        >
          {isRejecting ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
        </button>
        <button
          title="Add Note"
          aria-label="Add Note"
          onClick={() => setNoteOpen(true)}
          className={cn(iconBtn, "text-text-secondary hover:bg-surface-hover hover:text-text-primary")}
        >
          <MessageSquarePlus className="size-3.5" />
        </button>
      </div>

      <Dialog open={noteOpen} onClose={() => setNoteOpen(false)} title="Add a note" size="sm">
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="e.g. Following up on portfolio review before next round…"
          rows={4}
          autoFocus
          className="w-full resize-none rounded-(--radius-md) border border-border-strong bg-surface-raised p-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-500"
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setNoteOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={submitNote} disabled={!noteDraft.trim()}>
            Save note
          </Button>
        </div>
      </Dialog>
    </>
  );
}
