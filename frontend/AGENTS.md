# Frontend

## Overview

React Vite Single Page Application delivering a mobile first, touch friendly interface for court organizers to calculate session costs and generate VietQR payment cards.

## Key files

| File               | Owns                                           |
| ------------------ | ---------------------------------------------- |
| `src/main.tsx`     | React application entry point                  |
| `src/App.tsx`      | Main application shell and mobile view         |
| `src/index.css`    | Tailwind CSS v4 design tokens and theme styles |
| `src/lib/utils.ts` | Class merging utilities (cn)                   |
| `src/lib/api.ts`   | Backend API client and fetch helpers           |
| `src/components/members/` | Member roster, detail drawer, and debt settlement modals |

## Commands

```bash
# Dev server
npm run dev

# Typecheck and build
npm run build

# Preview production build
npm run preview
```

## Conventions

- Mobile first responsive layouts with standard touch target sizes (minimum 44x44px).
- Strict TypeScript types for all component props, state, and API models.
- Path aliases: use @/* for imports from src/.
- Styling via Tailwind CSS v4 utility classes and Shadcn UI primitives.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
