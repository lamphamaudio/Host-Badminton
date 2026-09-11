# 0003. Design system and UI foundation: Rationale

**Date**: 2026-09-10

## Context

Host Badminton is built primarily for badminton organizers and court hosts who operate the application directly at sports centers. When managing sessions on court, hosts face practical environmental hurdles: bright stadium lighting, sweaty hands, rapid player changes, and noisy surroundings. Every second spent struggling with tiny buttons or hard to read text slows down session tracking and frustrates players waiting to pay.

Existing generic admin dashboards and desktop oriented design systems fail in this mobile context. They feature small tap targets below 40 pixels, require multi step nested menus, and lack dedicated numeric input helpers for Vietnamese currency amounts like 50k, 100k, and 250k. 

Without a cohesive design system and UI foundation, upcoming features such as the core split calculator, VietQR payment card generator, court manager, and debt tracker will suffer from inconsistent layouts, conflicting color tokens, and poor touch ergonomics. Establishing standard tokens, navigation shells, and base components now ensures all subsequent product slices build rapidly on a unified, high quality foundation.

## Options considered

### Option 1: Tailwind CSS v4 with Radix UI Primitives (Chosen)

This option combines Tailwind CSS v4 `@theme` configuration with accessible headless Radix UI primitives (such as Dialog, Dropdown, Tabs, and Popover), styled directly through composable utility classes.

**Pros**:
- Zero design lock in with complete control over sport dark aesthetics and mobile micro animations.
- Maximum accessibility with built in keyboard navigation, ARIA attributes, and focus trapping.
- Extremely lightweight runtime with no heavy component library bundle overhead.
- Follows the industry standard Shadcn UI architectural pattern.

**Cons**:
- Requires creating and maintaining wrapper component files in `src/components/ui/`.

### Option 2: Pure Custom CSS Components without Radix UI

This option implements all buttons, dialogs, drawers, and tabs with plain React state and vanilla Tailwind CSS classes, without external primitive dependencies.

**Pros**:
- Zero additional npm dependencies.
- Absolute minimal JavaScript footprint.

**Cons**:
- Building robust accessible dialogs with focus management, scroll locking, and mobile touch dismissal is complex and error prone.
- High ongoing maintenance cost for mobile edge cases.

### Option 3: Heavy Prepackaged Mobile UI Framework (such as Ant Design Mobile)

This option adopts an all in one mobile UI framework with prebuilt components and preset styles.

**Pros**:
- Instant out of the box component collection.

**Cons**:
- Opinionated styling makes custom sport dark themes and energetic Vietnamese court branding difficult to customize.
- Heavy bundle size with rigid component APIs that conflict with Tailwind CSS v4.

## Rationale

Tailwind CSS v4 allows direct token definition via native CSS variables in `src/index.css`, creating a zero build configuration design token layer. Combining this with Radix UI headless primitives delivers full accessibility (ARIA, focus management, modal scroll locking) while leaving complete visual freedom to craft our sport dark court aesthetic.

This approach balances developer velocity with high mobile performance under the Skateboard build approach. It delivers lightweight, touch friendly base components tailored for one handed use on court, while preventing style fragmentation across future feature slices.
