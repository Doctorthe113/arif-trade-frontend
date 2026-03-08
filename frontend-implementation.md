# Frontend Implementation: ATI Control Center

Pure client-side SPA for Arif Trade International. Built with Vite + TanStack Router (file-based routing) + React 19. Talks to the PHP REST API in `arif_trade_international/restAPI/`.

## Product Goal

ATI is an inventory and sales workflow system for medical and surgical supplies. The frontend supports role-based working contexts:

- **Superadmin/Editor** — user management (create, update), plus full salesman workspace access.
- **Salesman** — customer ledger, invoices, transactions, inventory logs, quotations.
- **Doctor** — personal dashboard with spending, dues, billing, and monthly summaries.

Mirrors the backend resource model and permission boundaries.

## Stack

- **Framework**: Vite 7 + TanStack Router (file-based routing via `@tanstack/router-plugin/vite`).
- **Rendering**: 100% client-side SPA. No SSR, no prerendering.
- **UI**: React 19, shadcn/ui components in `src/components/ui/`.
- **Styling**: Tailwind CSS v4 with `@theme inline` CSS custom properties.
- **Data fetching**: `@tanstack/react-query` via `apiFetch()` wrapper in `src/lib/api.ts`.
- **Forms**: `react-hook-form` + `@hookform/resolvers/zod` + `zod/v4`.
- **Icons**: Lucide React.
- **Package manager**: Bun.
- **Lint / formatting**: Biome.

## Architecture

### Entry Point

`index.html` → `src/main.tsx` renders:

```
StrictMode > QueryClientProvider > AuthProvider > RouterProvider
```

- `QueryClientProvider` uses a shared `QueryClient` from `src/integrations/tanstack-query/root-provider.tsx`.
- `AuthProvider` (`src/lib/auth.tsx`) manages JWT auth state via `localStorage`.
- `RouterProvider` uses the file-based route tree from `src/router.tsx`.

### Auth

`src/lib/auth.tsx` exposes `AuthProvider` and `useAuth()`.

- JWT token stored in `localStorage`.
- Token decoded client-side to extract `role`, `name`, `email`.
- `login()` / `logout()` methods on context.
- `getToken()` exported for use by `apiFetch()`.

### API Layer

`src/lib/api.ts` exports `apiFetch<T>(path, options)`.

- Prepends `VITE_API_BASE_URL` (default `http://127.0.0.1:8000`).
- Injects `Authorization: Bearer <token>` header automatically.
- Returns typed JSON response.

### Layout

`src/components/app/app-layout.tsx` is the shared sidebar layout shell using shadcn `Sidebar*` components. Used by both `/salesman` and `/admin` route layouts.

## Route Structure

### `/` — Role-based redirect

Redirects authenticated users based on role:
- `doctor` → `/doctor-customer`
- All others → `/salesman/overview`
- Unauthenticated → `/login`

### `/login` — Login form

Email + password form. On success stores JWT and redirects to `/`.

### `/salesman` — Salesman layout

Sidebar layout with nav links. Superadmin users see additional admin nav items.

Child routes:
- `/salesman/overview` — Customer ledger with stat cards (total spent, total due, total billed).
- `/salesman/invoices` — Invoice table with pagination.
- `/salesman/transaction` — Payment lookup by invoice ID.
- `/salesman/inventory` — Inventory activity log table.
- `/salesman/quote` — Quotation creation form + existing quotation list.

### `/admin` — Admin layout (superadmin only)

Sidebar layout restricted to superadmin role.

Child routes:
- `/admin/create-user` — Create user form with role selection, validated via zod.
- `/admin/update-user` — User list table + inline edit form.

### `/doctor-customer` — Doctor dashboard

Single-page dashboard showing:
- Total spent, total due, total billed, monthly spending.
- Recent invoices and payment history.

## UI Direction

### Theme System

`src/styles.css` uses `@theme inline` with oklch-based CSS custom properties.

Provides shadcn-compatible tokens: `--background`, `--foreground`, `--card`, `--sidebar`, `--primary`, `--destructive`, etc. Light and dark mode via `.dark` class.

Fonts: Inter (body), Montserrat (headings), Fira Code (monospace).

### Components

shadcn/ui components in `src/components/ui/` — button, card, input, label, select, sidebar, separator, sheet, skeleton, table, tooltip.

`ThemeToggle` in `src/components/ThemeToggle.tsx` for light/dark switching.
- custom font tokens
- shadow and radius tokens
- shared ATI utility classes such as `.ati-frame`, `.ati-kicker`, `.ati-hero-grid`, `.ati-stat-grid`, and `.ati-ledger-line`

The stylesheet is intentionally global because the product is a dashboard system with repeated layout patterns.

## shadcn Component Layer

The migration required actual shadcn source components rather than custom div-based approximations.

Installed components now include:

- `button.tsx`
- `card.tsx`
- `badge.tsx`
- `table.tsx`
- `tabs.tsx`
- `avatar.tsx`
- `sidebar.tsx`
- `sheet.tsx`
- `scroll-area.tsx`
- `separator.tsx`
- `tooltip.tsx`
- `input.tsx`
- `skeleton.tsx`

Supporting hook:

- `src/hooks/use-mobile.ts`

These files are source-owned, so future UI adjustments remain inside the repo instead of depending on opaque package internals.

## Backend Alignment

The frontend is now explicitly aligned with the backend routes defined in `arif_trade_international/restAPI/index.php`.

### Public routes

- `GET /health`
- `GET /spec`
- `POST /auth/login`

### Authenticated domains

- **Users**: `/users`
- **Categories**: `/categories`
- **Products**: `/products`
- **Variants**: `/products/{productId}/variants`, `/variants/{id}`
- **Units**: `/units`
- **Variant units**: `/variants/{variantId}/units`, `/variant-units/{id}`
- **Customers**: `/customers`
- **Quotations**: `/quotations`, `/quotations/{id}`, `/quotations/{id}/status`
- **Invoices**: `/invoices`, `/invoices/{id}`
- **Payments**: `/invoices/{invoiceId}/payments`, `/payments/{id}`
- **Inventory log**: `/inventory/log`

### Role boundaries from the backend

- **superadmin**: full system management, including users and destructive actions.
- **editor**: quotation status updates, product maintenance, invoice and payment operations.
- **viewer**: read-oriented visibility, especially around logs and reports.
- **salesman**: browse products and submit quotation requests.

The current frontend layouts use these boundaries as the organizing principle for navigation and content.

## TanStack Query Integration

The repository already includes a TanStack Query provider setup:

- `src/integrations/tanstack-query/root-provider.tsx`
- `src/integrations/tanstack-query/devtools.tsx`

At this stage, the role pages are still static-presentational. That is intentional.

Reasoning:

- The migration foundation had to be completed first: routing, prerendering, shell, theming, and shadcn installation.
- The next layer can now add real query hooks and API client code without revisiting the app structure.

This keeps the migration incremental and reduces risk.

## Removed Astro Assumptions

The previous implementation plan described Astro pages, client-only islands, and Astro-specific routing. That is no longer accurate.

Key changes:

- Astro is no longer the rendering shell.
- Route files now live under TanStack Start file routing.
- Static generation is handled by TanStack Start prerendering, not Astro static output.
- Shared app framing now lives in React route components and shadcn sidebar composition.

## Files of Interest

### Core app files

- `vite.config.ts`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/about.tsx`
- `src/routes/superadmin.tsx`
- `src/routes/salesman.tsx`
- `src/routes/doctor-customers.tsx`

### Shared UI shell

- `src/components/app/role-workspace.tsx`
- `src/components/ThemeToggle.tsx`
- `src/styles.css`

### shadcn layer

- `src/components/ui/sidebar.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/avatar.tsx`

### Backend references

- `arif_trade_international/restAPI/index.php`
- `arif_trade_international/restAPI/modules/docs/DocsController.php`

## Development Workflow

### Commands

- `bun run dev` to run the frontend locally.
- `bun run build` to generate the static output.
- `bunx biome check --apply` to format and fix lint issues.

### Backend startup

The backend remains in `arif_trade_international/restAPI/` and should continue to be started through the repo’s existing local workflow, including `start-dev.sh` when Dockerized services are needed.

## Next Implementation Layer

The migration establishes structure, not full live data wiring yet.

The next logical steps are:

1. Add a frontend API client that targets the PHP endpoints already documented above.
2. Implement auth state and token refresh around `/auth/login`, `/auth/me`, and `/auth/refresh`.
3. Convert the three role dashboards from static demo data into TanStack Query-powered views.
4. Add forms for quotation submission, payment posting, customer editing, and product maintenance.
5. Introduce route guards once real auth state is connected.

## Summary

This frontend is now a TanStack Start application with static prerendering, shadcn source components, and three backend-aligned role layouts. It is structured to preserve static deployment flexibility while matching the real ATI PHP API and business workflow instead of the previous Astro starter assumptions.
