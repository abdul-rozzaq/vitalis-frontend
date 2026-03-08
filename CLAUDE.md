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

**Forms:** All forms live in `src/components/<module>/<module>-form.tsx`, use `react-hook-form` + Zod validation.

**Storage service (`src/services/storage/`):** Typed localStorage wrapper. Keys are defined in `storage.keys.ts`. Use `storageService.getItem<T>()` / `setItem` / `removeItem`.

## Known Gaps

- `appointments` page is mock-data only (no API integration).
- `tsconfig.json` references `src/middleware.ts` which does not exist.
- Some source files have garbled comment characters due to encoding issues; functionality is unaffected.
- Build output is `standalone` mode (`next.config.ts`).
