# PlaySphere AI — Project Structure Guide

Welcome to the PlaySphere AI codebase! This document outlines the project structure, design philosophy, and guidelines for adding new features. 

The codebase has been refactored into a clean, modular, and beginner-friendly structure that separates frontend views, backend logic, and shared configurations.

---

## 📂 Overall Directory Layout

The project is organized into four top-level folders:

```
playsphere-ai/
├── frontend/             # Next.js frontend application (App Router)
│   ├── public/           # Static media assets (logos, icons)
│   └── src/
│       ├── app/          # App Router pages, layouts, styles, and API wrappers
│       ├── components/   # Visual UI components (navbar, cards, map, dashboards)
│       └── contexts/     # React Context providers (auth context)
│
├── backend/              # Server-side business logic and integrations
│   ├── ai/               # AI engines (Concierge, Sports Buddy, Discover Insights)
│   └── firebase/         # Firebase Client SDK configs, auth and database wrappers
│
├── shared/               # Code shared between frontend and backend
│   ├── constants/        # Static data constants (e.g., seed venue data)
│   ├── helpers/          # Utility functions (pricing engines, date helpers)
│   └── types/            # Global TypeScript definition files
│
└── docs/                 # Architectural documentation and specifications
```

---

## 🛠️ Key Directories & Guidelines

### 1. Frontend (`frontend/`)
All user-facing code resides here. We use **Next.js with Turbopack** to compile the frontend application.
* **`frontend/src/app`**: Contains routes (`/venues`, `/dashboard`, `/admin`, `/owner`) and styles (`globals.css`).
* **`frontend/src/components`**: Holds UI components. Components should be stateless and visual wherever possible.
* **`frontend/src/contexts`**: Holds shared state context providers like the `AuthProvider` which handles auth listeners.
* **`frontend/next.config.ts`**: Frontend compiler and runtime config.
* **`frontend/tsconfig.json`**: Holds import path mappings.

### 2. Backend (`backend/`)
Contains AI prompting and database queries.
* **`backend/ai/`**: Wraps Google's Gemini SDK. Contains custom prompts, system configurations, and utility services like `buddy.ts` (sports matcher), `concierge.ts` (chat assistant), and `discover.ts` (venue optimizer).
* **`backend/firebase/`**: Contains auth operations (`auth.ts`), config initialization (`config.ts`), and database read/write queries (`firestore.ts`).

### 3. Shared (`shared/`)
Holds cross-cutting domain files.
* **`shared/types/`**: Holds typescript definitions. When adding new fields to database collections, add them to `index.ts` first.
* **`shared/helpers/`**: General utilities (e.g. currency formattings in `utils.ts` and booking slot generator in `pricing.ts`).

---

## 🔄 Import Aliases

To avoid deep relative paths (`../../../../`), we use Next.js / TypeScript path mappings. The following aliases are configured in `frontend/tsconfig.json`:

* **`@/*`** maps to `frontend/src/*` (e.g., `import { Navbar } from '@/components/layout/Navbar'`)
* **`@/backend/*`** maps to `backend/*` (e.g., `import { createBooking } from '@/backend/firebase/firestore'`)
* **`@/shared/*`** maps to `shared/*` (e.g., `import { Venue } from '@/shared/types'`)

---

## 🧱 Guidelines for Future Developers

1. **Keep Pages Thin**: Next.js page components under `frontend/src/app` should focus on rendering layouts, dispatching states, and calling backend services. Do not write raw SQL/Firestore query strings or AI system prompts directly in pages.
2. **Backend Services First**: When adding a new Firestore collection or a new AI feature, write the operations as functions in `backend/` first, export them, and import them in the frontend.
3. **Keep Shared Utilities Dry**: Non-visual helpers (pricing calculations, date parsers, validator strings) must go to `shared/helpers/` instead of being duplicated in component files.
4. **Use HSL Curated Colors**: Maintain the rich dark theme and premium neo-brutalist styling. Color utility functions are inside `shared/helpers/utils.ts`.
