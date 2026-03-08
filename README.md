# Vitalis Frontend

A Next.js 16 frontend for a hospital CRM system. It includes authentication, role-based UI permissions, and management modules for patients, employees, departments, payments, assignments, and schedules.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- TanStack Query (server state and caching)
- TanStack Table (data tables)
- Axios (API client)
- React Hook Form + Zod (forms and validation)
- Lucide icons + Motion animations

## Features

- Authentication with token persistence (`/auth/login`, `/auth/me`)
- Permission-gated UI actions via role permissions (`Can` component)
- Dashboard and sidebar app shell
- Patients module
  - list/create/update patients
  - patient detail page with timeline and file UI (with fallback mock timeline)
- Employees module
  - list/create/update users
  - role selection on employee forms
- Departments module
  - list/create/update/delete departments
- Payments module
  - list/create/update/delete payments
  - payment summary cards and normalized API response handling
- Assignments module
  - tabbed management for assignments, rooms, roles, permissions, and weekly schedule
- Appointments module
  - currently mock-data driven in UI (no API integration yet)

## Project Structure

```txt
src/
  app/                  # Next.js routes (dashboard, login, modules)
  components/           # Layout, forms, table, permission wrappers, sheets
  hooks/                # Auth and permissions hooks
  lib/                  # Axios client, utils, mock data
  services/storage/     # localStorage abstraction + keys
  types/                # Shared TS types
```

## Requirements

- Node.js 20+ recommended
- npm 10+ recommended
- A running backend API compatible with the endpoints listed below

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

Notes:
- `NEXT_PUBLIC_API_URL` is used as Axios `baseURL`.
- If your backend already includes `/api` in routes, keep the value as shown.

## API Endpoints Used by Frontend

- Auth: `POST /auth/login`, `GET /auth/me`
- Users/Roles: `GET/POST/PATCH /users`, `GET/POST/PATCH/DELETE /roles`
- Role permissions:
  - `GET /roles/:id/permissions`
  - `PUT /roles/:id/permissions`
  - `GET /permissions/available-routes`
- Patients: `GET/POST/PATCH /patients`, `GET /patients/:id`, `GET /patients/:id/timeline`
- Departments: `GET/POST/PATCH/DELETE /departments`
- Payments: `GET/POST/PATCH/DELETE /payments`
- Rooms: `GET/POST/PATCH/DELETE /rooms`
- Assignments: `GET/POST/PATCH/DELETE /assignments`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

4. Open:

```txt
http://localhost:3000
```

## Available Scripts

- `npm run dev` - start Next.js dev server (Turbopack)
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run clean` - clean Next.js build cache

## Current Notes / Gaps

- `appointments` page uses local mock data only.
- Some pages include mock fallback data when API data is unavailable.
- `tsconfig.json` references `src/middleware.ts`, but this file is not present.
- Several source files contain garbled comment characters due to encoding; functionality is unaffected but cleanup is recommended.
