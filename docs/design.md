# Host Badminton Design System

**Visual language, layout primitives, and UI component standards for Host Badminton.**

## Character & Art Direction

Host Badminton delivers a modern, energetic sport dark aesthetic engineered for badminton hosts operating smartphones directly at noisy, brightly lit sports centers. High contrast emerald and electric lime accents cut through screen glare, while large touch targets and rapid steppers allow effortless one handed calculations with sweaty hands.

- **Theme Mode**: Sport Dark (stadium night court feel).
- **Core Contrast**: Deep slate `#090d16` background paired with neon emerald `#10b981` primary and electric lime `#84cc16` accents.
- **Form Factor**: Mobile first, 44px minimum touch targets, constrained to maximum 480px width on desktop.

---

## Design Tokens

Design token values live directly in `frontend/src/index.css` via Tailwind CSS v4 `@theme` and native CSS variables.

### Color Tokens

| Token Name | Hex / Value | Purpose & Usage |
|---|---|---|
| `--color-bg-base` | `#090d16` | Main app background, deep court darkness |
| `--color-bg-surface` | `#111927` | Primary card and modal container surface |
| `--color-bg-surface-hover` | `#182338` | Interactive row and button hover state |
| `--color-border-subtle` | `#1e293b` | Default card and input borders |
| `--color-border-active` | `#334155` | Focused inputs and highlighted borders |
| `--color-primary` | `#10b981` | Vibrant emerald for primary CTA buttons and highlights |
| `--color-primary-foreground` | `#022c22` | Text on emerald buttons |
| `--color-accent` | `#84cc16` | Electric lime for shuttlecock counts and female player fee |
| `--color-accent-foreground` | `#1a2e05` | Text on lime buttons |
| `--color-destructive` | `#ef4444` | Red for unpaid debts, errors, and delete actions |
| `--color-text-primary` | `#f8fafc` | Main readable text |
| `--color-text-secondary` | `#94a3b8` | Subtitles, labels, and secondary details |
| `--color-text-muted` | `#64748b` | Timestamps and watermark notes |

### Typography

- **Body & Headings**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Monospace & Digits**: `JetBrains Mono`, `ui-monospace`, `monospace`
- **Tabular Figures**: Every currency, split price, player count, and debt sum must apply `.tabular-nums` or `font-mono` to prevent layout shifts during recalculations.

### Radii Scale

- Small: `0.375rem` (`rounded-md` / `rounded-lg`)
- Containers & Cards: `1rem` - `1.5rem` (`rounded-2xl` / `rounded-3xl`)
- Pills & Avatars: `9999px` (`rounded-full`)

---

## Component Catalog

### 1. Interactive Primitives

| Component | File | Key Props & Features |
|---|---|---|
| `Button` | `src/components/ui/button.tsx` | `variant`: `default`, `secondary`, `accent`, `outline`, `ghost`, `destructive`; `size`: `default` (44px), `sm`, `lg`, `icon`; active scaling press feedback |
| `Input` | `src/components/ui/input.tsx` | Standard text input with `leftIcon`, `rightElement`, and emerald focus ring |
| `MoneyInput` | `src/components/ui/money-input.tsx` | Formatted VND currency with quick increment chips (+10k, +50k, +100k, +200k) |
| `Stepper` | `src/components/ui/stepper.tsx` | Plus and minus touch buttons with min/max clamps for player and shuttlecock counts |
| `Card` | `src/components/ui/card.tsx` | Elevated container surface with header, title, description, content, and footer |
| `Badge` | `src/components/ui/badge.tsx` | Status chip with `paid` (emerald), `pending` (amber), `unpaid` (red), `member` (sky) |
| `Avatar` | `src/components/ui/avatar.tsx` | Radix Avatar with sporty gradient fallback for initials |

### 2. Modals & Overlays

| Component | File | Key Props & Features |
|---|---|---|
| `Sheet` | `src/components/ui/sheet.tsx` | Mobile bottom drawer with top grab handle, backdrop blur, and touch swipe dismiss |
| `Dialog` | `src/components/ui/dialog.tsx` | Centered modal for confirmations and desktop views |
| `Tabs` | `src/components/ui/tabs.tsx` | Segmented switcher for split stages, gender fees, and view filters |
| `Toast` | `src/components/ui/toast.tsx` & `src/lib/toast.tsx` | Non blocking notifications (`useToast().success`, `.error`, `.info`) |

### 3. Navigation & Layout Shell

| Component | File | Key Props & Features |
|---|---|---|
| `MobileAppShell` | `src/components/layout/mobile-app-shell.tsx` | Constrained 480px viewport shell with background ambient glow |
| `AppHeader` | `src/components/layout/app-header.tsx` | Sticky top app bar with logo, title, and action icons |
| `BottomNav` | `src/components/layout/bottom-nav.tsx` | Persistent 4 tab bottom bar: Calculator, Sessions, Members, Settings |
| `BillCardPreview` | `src/components/bill/bill-card-preview.tsx` | Shareable VietQR payment bill layout with copy and share actions |

---

## Mobile Ergonomics & Invariants

1. **Touch Target Standard**: Every clickable control has a minimum 44px by 44px bounding box.
2. **Safe Area Insets**: Bottom navigation bar uses `pb-safe` (`env(safe-area-inset-bottom)`) and header uses `pt-safe` (`env(safe-area-inset-top)`).
3. **No Horizontal Scroll**: Content wraps or scrolls vertically within the max 480px shell.
4. **Immediate Feedback**: Actions provide micro animations (`active:scale-95`) or toast confirmations within 100ms.
