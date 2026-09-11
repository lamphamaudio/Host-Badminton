# Verify: Design system and UI foundation · spec 0003 · updated 2026-09-10
_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Open frontend in browser (`npm run dev` at `http://localhost:5173`) → Mobile app shell renders with Sport Dark theme (`#090d16`), glowing background accents, sticky header, and 4 tab bottom navigation bar → **AC-1**, **AC-7**
- [x] Tap quick increment chips (+50k, +100k, +200k) on Court Fee input → `MoneyInput` updates formatted amount with thousand dot separators (`formatVND`) without layout shift → **AC-2**, **AC-3**
- [x] Tap plus and minus stepper buttons on Shuttlecock and Player counts → Numbers increment and decrement with minimum clamps (min 0) and monospace tabular font → **AC-2**, **AC-4**
- [x] Switch between "Chia đều" and "Ưu đãi nữ (-10k)" tabs → Active tab highlights with emerald background and female discount recomputes live → **AC-6**
- [x] Tap "Mở Bottom Sheet" button → Slide up drawer opens smoothly with top drag handle, background dimming, and closes on backdrop tap → **AC-6**
- [x] Tap "Mở Dialog" button → Centered confirmation modal appears with action buttons → **AC-6**
- [x] Tap Toast trigger buttons (Success / Error / Info) → Non blocking toast alerts appear at top of mobile screen with auto dismissal after 3 seconds → **AC-8**
- [x] Review VietQR Bill Card preview and tap "Chép hóa đơn" → Bill details format cleanly with court info, player split, and bank info; toast confirms clipboard copy → **AC-8**, **AC-9**
- [x] Inspect `docs/design.md` → Living design guide catalogs color tokens, typography rules, component usage, and mobile touch invariants → **AC-10**

## Commands

- [x] `cd frontend && npm run typecheck` → TypeScript compiler exits with code 0 (zero errors)
- [x] `cd frontend && npm run lint` → ESLint checks pass clean with zero errors
- [x] `cd frontend && npm run format:check` → Prettier code style check passes clean
- [x] `cd frontend && npm run build` → Vite production build bundles clean under 350kB

## Acceptance criteria coverage

- **AC-1**: Color tokens and sport dark variables in `frontend/src/index.css` (verified)
- **AC-2**: Monospace tabular numbers and `formatVND` helpers in `frontend/src/lib/formatters.ts` (verified)
- **AC-3**: Touch friendly `Button` and `Input` with min 44px height in `frontend/src/components/ui/` (verified)
- **AC-4**: Touch `Stepper` counter with plus and minus buttons in `frontend/src/components/ui/stepper.tsx` (verified)
- **AC-5**: `Card` and `Badge` status chips in `frontend/src/components/ui/` (verified)
- **AC-6**: `Sheet`, `Dialog`, and `Tabs` Radix UI primitives in `frontend/src/components/ui/` (verified)
- **AC-7**: `MobileAppShell`, `AppHeader`, and `BottomNav` in `frontend/src/components/layout/` (verified)
- **AC-8**: `ToastProvider` and `useToast` in `frontend/src/lib/toast.tsx` and `frontend/src/components/ui/toast.tsx` (verified)
- **AC-9**: `BillCardPreview` in `frontend/src/components/bill/bill-card-preview.tsx` (verified)
- **AC-10**: Living design documentation in `docs/design.md` (verified)
