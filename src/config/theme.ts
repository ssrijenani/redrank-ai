/**
 * config/theme.ts
 * JS-readable mirror of the CSS custom properties defined in src/index.css.
 * Keep these two files in sync manually — this file exists only because
 * some libraries (Recharts SVG fills, Framer Motion keyframes) need real
 * values rather than `var(--token)` references. Everything else in the
 * app should use the Tailwind utilities / CSS variables directly.
 */

export const colors = {
  bg: "#09090B",
  surface: "#18181B",
  surfaceHover: "#1F1F23",
  surfaceRaised: "#232328",
  border: "#27272A",
  borderStrong: "#3F3F46",

  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",

  accent400: "#818CF8",
  accent500: "#6366F1",
  accent600: "#4F46E5",
  accent700: "#4338CA",

  violet400: "#A78BFA",
  violet500: "#8B5CF6",
  violet600: "#7C3AED",

  success400: "#34D399",
  success500: "#10B981",

  warning400: "#FBBF24",
  warning500: "#F59E0B",

  error400: "#FB7185",
  error500: "#F43F5E",
} as const;

/** Ordered palette for multi-series charts (funnel stages, heatmap legends, etc). */
export const chartSeries = [
  colors.accent500,
  colors.violet500,
  colors.success500,
  colors.warning500,
  colors.error500,
] as const;

export const motion = {
  durationFast: 0.12,
  durationBase: 0.18,
  durationSlow: 0.26,
  easeOutSmooth: [0.16, 1, 0.3, 1] as const,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const;
