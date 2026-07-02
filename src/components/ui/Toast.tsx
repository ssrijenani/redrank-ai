import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/cn";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

const toneIcon: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="size-4 text-success-400" />,
  error: <XCircle className="size-4 text-error-400" />,
  info: <Info className="size-4 text-accent-400" />,
};

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "flex items-start gap-3 rounded-(--radius-lg) border border-border bg-surface-raised p-3.5 shadow-(--shadow-lg)"
            )}
          >
            <span className="mt-0.5 shrink-0">{toneIcon[t.tone]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-text-primary">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-[12px] text-text-secondary">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="shrink-0 text-text-muted hover:text-text-primary"
              aria-label="Dismiss notification"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
