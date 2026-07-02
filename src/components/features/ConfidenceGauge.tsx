import { scoreTone } from "../../lib/scoring";

const toneStroke: Record<string, string> = {
  success: "#10B981",
  accent: "#6366F1",
  warning: "#F59E0B",
  error: "#F43F5E",
};

interface ConfidenceGaugeProps {
  value: number;
  label: string;
}

/** Semi-circle gauge, 0-100. Circumference math kept simple with a fixed radius. */
export function ConfidenceGauge({ value, label }: ConfidenceGaugeProps) {
  const radius = 36;
  const circumference = Math.PI * radius; // half circle
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);
  const tone = scoreTone(clamped);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 88 48" className="w-24">
        <path
          d="M 6 44 A 38 38 0 0 1 82 44"
          fill="none"
          stroke="#27272A"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M 6 44 A 38 38 0 0 1 82 44"
          fill="none"
          stroke={toneStroke[tone]}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <text x="44" y="38" textAnchor="middle" className="fill-[var(--color-text-primary)] font-semibold" fontSize="16">
          {clamped}%
        </text>
      </svg>
      <p className="-mt-1 text-[11px] text-text-secondary">{label}</p>
    </div>
  );
}
