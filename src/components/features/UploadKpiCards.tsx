import { FileStack, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card } from "../ui";

interface UploadKpiCardsProps {
  total: number;
  completed: number;
  uploading: number;
  failed: number;
}

export function UploadKpiCards({ total, completed, uploading, failed }: UploadKpiCardsProps) {
  const metrics = [
    { label: "Total Files", value: total, icon: FileStack, tone: "neutral" as const },
    { label: "Completed", value: completed, icon: CheckCircle2, tone: "success" as const },
    { label: "Uploading", value: uploading, icon: Loader2, tone: "accent" as const, spin: true },
    { label: "Failed", value: failed, icon: XCircle, tone: "error" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label} padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-medium text-text-secondary">{m.label}</span>
            <span
              className={`flex size-6 items-center justify-center rounded-(--radius-sm) ${
                m.tone === "accent"
                  ? "bg-accent-600/10 text-accent-400"
                  : m.tone === "success"
                    ? "bg-success-500/10 text-success-400"
                    : m.tone === "error"
                      ? "bg-error-500/10 text-error-400"
                      : "bg-surface-raised text-text-muted"
              }`}
            >
              <m.icon className={`size-3.5 ${m.spin && m.value > 0 ? "animate-spin" : ""}`} />
            </span>
          </div>
          <p className="mt-1.5 text-[20px] font-semibold tabular text-text-primary tracking-tight">
            {m.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
