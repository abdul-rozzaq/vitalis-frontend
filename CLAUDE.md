# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Next.js + Turbopack) at http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint
npm run clean     # Clean Next.js build cache
```

No test runner is configured.

## Environment

Copy `.env.example` to `.env` and set:

```
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

This is the Axios `baseURL`. The backend must already include `/api` in its routes if the URL ends with `/api`.

## Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query, TanStack Table, Axios, React Hook Form + Zod, Motion.

**App shell (`src/app/layout.tsx`):** Wraps everything in `<Providers>` (TanStack Query client) and `<AppLayout>`. `AppLayout` renders the sidebar + header shell for all routes except `/login`, and shows a Lottie loading screen while auth resolves.

**Auth flow (`src/hooks/use-auth.ts`):** `useAuth` queries `GET /auth/me` on mount. If unauthenticated and not on `/login`, redirects to `/login`. Token (JWT) is stored in localStorage via `storageService`. The Axios instance in `src/lib/api.ts` attaches the token via a request interceptor.

**Permission system:**
- `usePermissions` (`src/hooks/use-permissions.ts`) fetches `GET /roles/:id/permissions` for the current user's role and exposes a `can(method, path)` function. Superusers bypass all checks.
- `<Can method="POST" path="/api/patients">` (`src/components/ui/can.tsx`) is the declarative gate used throughout pages and the sidebar nav. Sidebar nav items are hidden if the user lacks `GET` permission on the corresponding API path.
- Permissions are matched by HTTP method + path, supporting `:param` wildcards.

**Page pattern:** Each module page (patients, employees, departments, payments, assignments) follows the same structure:
1. `useQuery` to fetch list data via `api.get(...)`.
2. `useMutation` for create/update/delete — invalidates the relevant query key on success.
3. `<DataTable>` (TanStack Table wrapper in `src/components/ui/data-table.tsx`) for the list.
4. `<Sheet>` (slide-over panel) containing a form component for create/edit.
5. `<Can>` gates around action buttons.

**Forms:** All forms live in `src/features/<module>/components/<module>-form.tsx`, use `react-hook-form` + Zod validation.

**Storage service (`src/lib/services/storage/`):** Typed localStorage wrapper. Keys are defined in `storage.keys.ts`. Use `storageService.getItem<T>()` / `setItem` / `removeItem`.

## Directory Structure Rules

These conventions were established during refactoring and must be followed when adding new files.

### `src/features/`

Each feature module follows this layout:

```
src/features/<module>/
  components/     ← all React components for this module
  types.ts        ← TypeScript types/interfaces (if needed)
  utils.ts        ← helper functions, constants, style maps (if needed)
```

**Rules:**
- Components always go inside `components/` — never directly in the feature root.
- A feature must be justified by **multiple files or multiple consumers**. A single component used only by one parent module does not deserve its own feature folder — place it inside the parent's `components/`.
- Example: `RoundModal` (only used in wards) lives in `features/wards/components/`, not `features/rounds/`.
- Example: `AddCaseStepForm` (patient-centric) lives in `features/patients/components/`, not `features/cases/`.
- A `types.ts`-only feature (no components) is acceptable when the types are shared across multiple pages (e.g. `features/lab/types.ts`).

**Current feature modules:**

| Module | Contents |
|--------|----------|
| `appointments` | components + types.ts + utils.ts |
| `assignments` | components + types.ts + utils.ts |
| `balance` | components (patient billing, used from patients and invoices pages) |
| `departments` | components |
| `diagnostic` | components + types.ts |
| `employees` | components |
| `lab` | types.ts only (shared across lab and assignments pages) |
| `operations` | components (includes operation-type-form) |
| `patients` | components + types.ts + utils.ts (includes add-case-step-form) |
| `settings` | schemas.ts + types.ts + utils.ts |
| `shifts` | components |
| `wards` | components (includes RoundModal and ward-payment-panel) |

### `src/components/`

Shared UI primitives and layout — not feature-specific.

```
src/components/
  layouts/        ← page/app layout components (AppLayout, PageLayout)
  navigation/     ← sidebar, topbar, contextual panel
  ui/             ← reusable primitives: Sheet, DataTable, Can, FormError,
                     FormButtons, FormField, format-phone, use-phone-formatter, …
  design-system/  ← design token components (Badge, Button, Card, …)
```

**Rules:**
- Utility functions that are components or hooks go in `components/ui/`, not in the `components/` root.
- Layout wrappers go in `components/layouts/`, not in the `components/` root.
- Never place loose `.tsx` files directly in `src/components/`.

### `src/lib/`

Shared pure utilities — no React, no API calls.

```
src/lib/
  formatters.ts      ← date/time/currency formatting functions
  status-styles.ts   ← INVOICE_STATUS_CONFIG, ROLE_STYLES
  helpers.ts         ← initialsOf, deriveOrderStatus, toAssignmentOptions
  api.ts             ← Axios instance with auth interceptor
  services/storage/  ← typed localStorage wrapper
  …
```

**Rules:**
- Before adding a formatter/helper inline in a page, check if it belongs in `formatters.ts` or `helpers.ts`.
- Status color maps (badge styles, role colors) belong in `status-styles.ts`.

## Known Gaps

- `appointments` page is mock-data only (no API integration).
- `tsconfig.json` references `src/middleware.ts` which does not exist.
- Some source files have garbled comment characters due to encoding issues; functionality is unaffected.
- Build output is `standalone` mode (`next.config.ts`).
