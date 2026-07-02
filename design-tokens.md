# RedRank AI — Design Tokens & System Rules

Single source of truth for the visual language. Token values live in `src/index.css`
(`@theme` block); this document explains *why* and *when* to use each one.

---

## Color Palette

### Surfaces
| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#09090B` | App background only |
| `--color-surface` | `#18181B` | Default card/panel background |
| `--color-surface-hover` | `#1F1F23` | Hover state for interactive surfaces |
| `--color-surface-raised` | `#232328` | Nested/raised surfaces (table headers, input fields) |
| `--color-border` | `#27272A` | Default hairline border — use everywhere, not shadows, to separate flat dark surfaces |
| `--color-border-strong` | `#3F3F46` | Hover/focus border, or emphasis dividers |

### Text
| Token | Value | Usage |
|---|---|---|
| `--color-text-primary` | `#FAFAFA` | Headings, primary content |
| `--color-text-secondary` | `#A1A1AA` | Body copy, descriptions |
| `--color-text-muted` | `#71717A` | Placeholders, timestamps, disabled |

### Accent (brand / primary actions)
Indigo is the primary action color (buttons, links, active nav). **Violet is reserved
for AI-originated content** — generated rubrics, AI score badges, "Generate" actions —
so users learn to visually distinguish "the system did this" from "I did this."

| Token | Value |
|---|---|
| `--color-accent-400/500/600/700` | `#818CF8 / #6366F1 / #4F46E5 / #4338CA` |
| `--color-violet-400/500/600` | `#A78BFA / #8B5CF6 / #7C3AED` |

### Status
| Token | Meaning |
|---|---|
| `--color-success-400/500` | Approved, passed, positive delta |
| `--color-warning-400/500` | Hold, needs review, caution |
| `--color-error-400/500` | Rejected, failed, destructive action |

**Rule:** status colors are reserved for decision/state semantics only — never used decoratively.

---

## Typography

- **Typeface:** Inter, all weights via Google Fonts (400/500/600/700/800).
- **Numeral display:** apply `.tabular` class (or `tabular-nums`) to any score, percentage,
  or metric that updates/sorts, to prevent digit-width jitter.

| Role | Size | Weight |
|---|---|---|
| Page title | 15px | 600 |
| Card title | 15px | 600 |
| Section eyebrow | 12px, uppercase, tracked | 500 |
| Body | 13–14px | 400 |
| Caption / meta | 12px | 400 |
| Data-dense table cell | 13–14px, tabular | 400–500 |

---

## Spacing Scale

Use Tailwind's default 4px-based scale (`p-1` = 4px ... `p-6` = 24px). Standard rhythm:

- Card padding: `p-5` (20px) default, `p-3` for dense/compact cards
- Section gaps: `gap-6` (24px) between major page sections
- Inline element gaps: `gap-2` to `gap-3`

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Badges, small buttons, focus rings |
| `--radius-md` | 8px | Buttons, inputs, nav items |
| `--radius-lg` | 12px | Cards, tables, dialogs |
| `--radius-xl` | 16px | Large modals, hero panels |

---

## Shadows

Dark backgrounds need shadow tuned darker/tighter than light-mode defaults — never the
default Tailwind shadow values, they read as muddy gray haze on `#09090B`.

| Token | Usage |
|---|---|
| `--shadow-xs` | Buttons (resting depth) |
| `--shadow-sm` | Cards on hover |
| `--shadow-md` | Dropdowns, popovers |
| `--shadow-lg` | Dialogs, modals |
| `--shadow-glow-accent` | Reserved for the single most important CTA per screen only (e.g. "Generate Rubric") — never more than one glow per view |

---

## Motion Rules

- **Durations:** `--duration-fast` (120ms) for hover/focus, `--duration-base` (180ms) for
  most transitions, `--duration-slow` (260ms) for dialogs/page transitions.
- **Easing:** `--ease-out-smooth` (`cubic-bezier(0.16, 1, 0.3, 1)`) everywhere — no linear, no bounce.
- **What gets animated:** page-level mount transitions, dialog enter/exit, toast enter/exit,
  list stagger on first load, skeleton pulse. **What does not:** decorative hover scale,
  gratuitous parallax, anything that delays a recruiter from acting.
- **Always respect** `prefers-reduced-motion` — handled globally in `index.css`.

---

## Responsive Breakpoints

Standard Tailwind breakpoints, used consistently:

| Breakpoint | Width | Behavior |
|---|---|---|
| Base (mobile) | < 768px | Sidebar collapses/hides, single-column cards, tables scroll horizontally |
| `md:` | ≥ 768px | Sidebar visible, 2-column card grids |
| `lg:` | ≥ 1024px | Full multi-column dashboards, side-by-side rubric/preview panels |
| `xl:` | ≥ 1280px | Max content width caps to keep line-length sane on ultra-wide |

---

## Grid System

- Page content max-width: `max-w-7xl`, centered, with `px-4 md:px-6` gutters.
- Dashboard/card grids: CSS grid, `grid-cols-1 md:grid-cols-2 xl:grid-cols-4` for summary
  metric cards; `grid-cols-1 lg:grid-cols-3` for content + side panel layouts (e.g. Job Studio
  JD input next to live rubric preview).

---

## Component Usage Rules

- **Button:** `primary` = one per view max (the main forward action). `secondary` for
  parallel/cancel actions. `ghost` for low-emphasis/icon-only actions. `danger` only for
  destructive or "Reject" actions.
- **Badge:** `tone="violet"` reserved for AI-generated/AI-scored content. `tone` for
  success/warning/error maps 1:1 to decision states (approved/hold/rejected).
- **Card:** default `padding="md"`. Use `interactive` only when the whole card is clickable
  (e.g. job summary card linking to ranking) — never combine with internal buttons that
  also navigate, to avoid nested-click ambiguity.
- **Table:** every data table must define `sortValue` on at least the primary score column.
  Row click should navigate to the relevant detail view (Decision Workspace) where applicable.
- **EmptyState / Skeleton:** every page that fetches via `services/api.ts` must render
  `TableSkeleton`/`CardSkeleton` during `isLoading`, and `EmptyState` (tone="error") on
  caught errors — never a blank screen.
- **Toast:** use for confirmations of write actions only (decision submitted, job saved,
  rubric saved) — never for passive/informational messages that aren't a result of a user action.
