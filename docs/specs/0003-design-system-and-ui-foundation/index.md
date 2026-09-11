# 0003. Design system and UI foundation

**Date**: 2026-09-10
**Status**: Accepted

## Summary

This specification establishes the visual design system, mobile layout primitives, and base user interface components for Host Badminton. The system delivers an energetic sport dark theme with vibrant emerald and electric lime accents, optimized for court organizers managing games on mobile phones under high glare. It implements Tailwind CSS v4 design tokens, accessible Radix UI primitives, a fixed bottom navigation shell, and touch friendly inputs with quick numeric steppers.

## Requirements

**User stories**:
- As a badminton host on court, I want high contrast dark mode visuals with large touch targets so that I can operate the app smoothly with one hand under bright stadium lights.
- As a badminton host entering session costs, I want formatted money inputs and quick stepper buttons so that I can adjust player counts and currency figures in seconds without typing errors.
- As a badminton host switching between active tasks, I want a persistent bottom navigation bar so that I can jump instantly between the calculator, session history, player debts, and settings.
- As a frontend engineer building new features, I want reusable accessible UI primitives and design tokens so that every screen remains visually polished and consistent.

**Acceptance criteria**:
- **AC-1**: Tailwind CSS v4 theme tokens in `frontend/src/index.css` define the Sport Dark color palette including slate background (`#090d16`), elevated card surface (`#131b2e`), vibrant emerald primary (`#10b981`), electric lime accent (`#84cc16`), destructive red (`#ef4444`), border colors, and standard radii.
- **AC-2**: Typography scale and font stack support clean modern sans serif typography with monospace tabular numbers for accurate financial alignment and VND currency amounts.
- **AC-3**: Mobile touch friendly Button and Input primitives guarantee a minimum 44 by 44 pixel touch target with tactile active scaling feedback and accessible focus rings.
- **AC-4**: Touch Stepper primitive provides accessible plus and minus buttons for rapid incrementing and decrementing of player counts and shuttlecock units.
- **AC-5**: Standardized Card and Badge primitives provide elevated container surfaces with subtle border glows, backdrop blur filters, and status chips for payment states.
- **AC-6**: Headless Sheet and Dialog primitives wrap Radix UI Dialog to deliver smooth bottom drawer interactions on mobile viewports with backdrop dimming.
- **AC-7**: Mobile App Shell implements a sticky top header and a fixed bottom navigation bar supporting core tabs for Calculator, Sessions, Members, and Settings.
- **AC-8**: Non blocking Toast notification primitive provides instant visual feedback for clipboard copy confirmations, network actions, and input validation alerts.
- **AC-9**: Dedicated VietQR Bill Preview Card container provides a high contrast 4:5 and 9:16 export friendly layout ready for image rendering and sharing to Zalo and Messenger.
- **AC-10**: Living design documentation in `docs/design.md` catalogs all design tokens, typography rules, spacing standards, and component examples for developers.

## Decision

**Chosen option**: Option 1: Tailwind CSS v4 with Radix UI Primitives.

We adopt Tailwind CSS v4 custom theme tokens paired with accessible headless Radix UI primitives to build our mobile first UI component foundation.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

### Visual Design Tokens

```css
/* Color Tokens (Sport Dark Theme) */
--color-bg-base: #090d16;        /* Deep stadium slate */
--color-bg-surface: #111927;     /* Elevated card background */
--color-bg-surface-hover: #182338;
--color-border-subtle: #1e293b;
--color-border-active: #334155;

--color-primary: #10b981;        /* Vibrant court emerald */
--color-primary-foreground: #022c22;
--color-primary-hover: #059669;

--color-accent: #84cc16;         /* Electric lime shuttlecock */
--color-accent-foreground: #1a2e05;

--color-destructive: #ef4444;    /* Crimson warning */
--color-destructive-foreground: #ffffff;

--color-text-primary: #f8fafc;
--color-text-secondary: #94a3b8;
--color-text-muted: #64748b;
```

### Component Inventory

| Component | File Path | Primitive / Tech | Purpose & Key Features |
|---|---|---|---|
| `Button` | `src/components/ui/button.tsx` | Native button + `cva` | Primary, secondary, outline, ghost, and destructive variants; 44px minimum touch height; active press scale animation |
| `Input` | `src/components/ui/input.tsx` | Native input + `clsx` | Formatted numeric support, thousand separators, focus ring, search and clear icon slots |
| `MoneyInput` | `src/components/ui/money-input.tsx` | Native input + quick chips | Numeric input paired with rapid tap chips (+10k, +50k, +100k, +200k) for lightning fast money entry |
| `Stepper` | `src/components/ui/stepper.tsx` | Custom touch stepper | Plus and minus touch target buttons for player counts and shuttlecock counts with min and max clamps |
| `Card` | `src/components/ui/card.tsx` | Container wrapper | Elevated card surface with subtle border, optional glow, header, title, description, content, and footer slots |
| `Badge` | `src/components/ui/badge.tsx` | Span chip | Status chips for Paid (emerald), Pending (amber), Unpaid (red), and Member tags |
| `Sheet` | `src/components/ui/sheet.tsx` | Radix Dialog | Mobile bottom drawer with smooth slide up transition, grab handle, and touch swipe down dismissal |
| `Dialog` | `src/components/ui/dialog.tsx` | Radix Dialog | Centered modal for desktop viewports and confirmation alerts |
| `Toast` | `src/components/ui/toast.tsx` | Radix Toast or lightweight dispatcher | Non intrusive pop up notifications with success, error, and info styles |
| `Tabs` | `src/components/ui/tabs.tsx` | Radix Tabs | Accessible segmented switcher for gender pricing, split stages, and view filters |
| `Avatar` | `src/components/ui/avatar.tsx` | Radix Avatar | Player initials and profile picture with status indicator dot |
| `AppHeader` | `src/components/layout/app-header.tsx` | Header bar | Sticky top navigation bar with brand icon, active session title, and quick action icon buttons, padded for safe area top |
| `BottomNav` | `src/components/layout/bottom-nav.tsx` | Fixed nav bar | Fixed bottom navigation bar with 4 core tabs (Calculator, Sessions, Members, Settings), padded for safe area bottom |
| `BillCardPreview` | `src/components/bill/bill-card-preview.tsx` | Canvas export wrapper | Shareable VietQR payment bill layout with high contrast court summary, cost breakdown, and QR code |

### Value Sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Display theme colors and surfaces | CSS custom variables and utility classes | Defined in `src/index.css` theme tokens |
| Format money amounts | Formatted currency string with VND suffix | Utility helper in `src/lib/formatters.ts` |
| Adjust player and shuttle counts | Updated numeric count | User touch interaction on `Stepper` primitive |
| Select quick money increment | Updated total money amount | User tap on `MoneyInput` preset chips (+50k, +100k) |
| Navigate between core views | Active route and navigation tab highlight | Application navigation state in `BottomNav` |
| Present mobile action sheets | Slide up bottom drawer content | Trigger event opening Radix `Sheet` primitive |
| Show copy / save feedback | Toast notification message and icon | Toast event trigger in `src/lib/toast.ts` |

### Key Invariants

- All interactive touch targets (buttons, inputs, stepper buttons, navigation tabs) must maintain a minimum bounding box of 44 by 44 physical pixels on mobile viewports.
- All numeric displays representing currency, player counts, and split totals must use monospace tabular numbers (`font-mono` or `tabular-nums`) to prevent horizontal layout shift during recalculation.
- The mobile app shell must constrain content width to a maximum of 480 pixels on larger screens to preserve mobile ergonomics and prevent excessive line lengths.
- The fixed bottom navigation bar and sticky header must account for mobile device safe areas using `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` to prevent overlap with the home indicator bar.
- Theme tokens must meet WCAG AA contrast ratio standards (minimum 4.5:1 for normal text and 3:1 for large text) against dark surfaces.

### Security Model

All UI foundation components are client side presentation primitives with zero privileged data access. Inputs must sanitize user strings to prevent Cross Site Scripting (XSS) when rendering dynamic player names or notes.

### Configuration Required

No external API keys or secrets are required for the design system and UI foundation.

### Critical Test Scenarios

- Happy path: Rendering the complete component showcase with all buttons, steppers, cards, bottom sheets, and navigation tabs functioning smoothly on mobile viewport (verifies AC-1, AC-3, AC-4, AC-5, AC-6, AC-7).
- Currency and number formatting: Entering values in `MoneyInput` and stepping counts with `Stepper` formats numbers with thousand separators without NaN errors (verifies AC-2, AC-3, AC-4).
- Bottom sheet drawer interaction: Opening and dismissing the bottom sheet via touch backdrop tap and close trigger works smoothly without scroll jitter (verifies AC-6).
- Toast feedback: Triggering a clipboard copy action displays a non blocking success toast that automatically disappears after three seconds (verifies AC-8).
- Bill preview rendering: Rendering `BillCardPreview` displays session costs, player summary, and VietQR placeholder with crisp contrast (verifies AC-9).

## Build plan

- [x] 1. Configure Tailwind CSS v4 `@theme` tokens, Sport Dark color variables, and typography classes in `frontend/src/index.css`, satisfies **AC-1**, **AC-2**
- [x] 2. Install Radix UI headless dependencies (`@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-avatar`, `@radix-ui/react-toast`, `@radix-ui/react-slot`) and class merging utility in `frontend/src/lib/utils.ts`, satisfies **AC-3**, **AC-6**
- [x] 3. Create currency and numeric formatting helpers in `frontend/src/lib/formatters.ts` with Vietnamese currency (VND) support, satisfies **AC-2**
- [x] 4. Build core input and action primitives in `frontend/src/components/ui/` (`Button`, `Input`, `MoneyInput`, `Stepper`, `Card`, `Badge`, `Avatar`), satisfies **AC-3**, **AC-4**, **AC-5**
- [x] 5. Build overlay and modal primitives (`Sheet`, `Dialog`, `Tabs`, `Toast`), satisfies **AC-6**, **AC-8**
- [x] 6. Build mobile navigation layout primitives (`AppHeader`, `BottomNav`, and `MobileAppShell`), satisfies **AC-7**
- [x] 7. Build the shareable VietQR bill card preview container (`BillCardPreview`), satisfies **AC-9**
- [x] 8. Create living design documentation in `docs/design.md` and build an interactive UI playground screen in `frontend/src/App.tsx`, satisfies **AC-10**

## Consequences

**Positive**:
- Consistent, highly polished sport dark aesthetic tailored for mobile on court usage.
- Rapid developer velocity for upcoming calculator, session manager, and debt tracker slices.
- Solid touch ergonomics with guaranteed 44px touch targets and fast numeric steppers.
- Fully accessible headless modal and drawer primitives without bloated UI framework lock in.

**Negative / tradeoffs**:
- Maintaining custom component wrappers requires developer discipline when adding new primitives.
- Dark mode is established as the primary court theme; full light mode toggle is deferred to future customization settings.

**Neutral**:
- Requires installing Radix UI primitive packages in the frontend workspace.

## Follow-up

- [ ] Run `/check verify design system & UI foundation` to verify component interactions on live UI.
- [ ] Run `/test design system & UI foundation` to lock in component behavior.
