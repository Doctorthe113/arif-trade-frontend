# Frontend Implementation: ATI Control Center

Pure client-side SPA for Arif Trade International. Built with Vite + TanStack Router (file-based routing) + React 19. Talks to the PHP REST API in `arif_trade_international/restAPI/`.

## Product Goal

ATI is an inventory and sales workflow system for medical and surgical supplies. The frontend supports role-based working contexts:

- Superadmin/Editor: user management plus full salesman workspace access.
- Salesman: customer ledger, invoices, transactions, inventory logs, quotations.
- Doctor: personal dashboard with spending, dues, billing, and monthly summaries.

## Stack

- Framework: Vite 7 + TanStack Router.
- Rendering: client-only SPA. No SSR.
- UI: React 19, shadcn/ui components in `src/components/ui/`.
- Styling: Tailwind CSS v4 with `@theme inline` CSS custom properties.
- Data fetching: `@tanstack/react-query` via `apiFetch()` in `src/lib/api.ts`.
- Forms: `react-hook-form` + `@hookform/resolvers/zod` + `zod/v4`.
- Icons: Lucide React.
- Package manager: Bun.
- Lint and format: Biome.

## Architecture

### Entry Point

`index.html` -> `src/main.tsx` renders:

`StrictMode > QueryClientProvider > AuthProvider > RouterProvider`

- `QueryClientProvider` uses `src/integrations/tanstack-query/root-provider.tsx`.
- `AuthProvider` in `src/lib/auth.tsx` manages JWT state via `localStorage`.
- `RouterProvider` uses the generated route tree from `src/router.tsx`.

### Auth

`src/lib/auth.tsx` exposes `AuthProvider` and `useAuth()`.

- JWT token stored in `localStorage`.
- Token decoded client-side to extract `role`, `name`, `email`.
- `login()` and `logout()` methods on context.
- `getToken()` exported for `apiFetch()`.

### API Layer

`src/lib/api.ts` exports `apiFetch<T>(path, options)`.

- Prepends `VITE_API_BASE_URL`.
- Injects `Authorization: Bearer <token>` automatically.
- Returns typed JSON.

### Layout

`src/components/app/app-layout.tsx` is the shared sidebar shell using shadcn `Sidebar*` components.

The shell and surrounding utilities were tightened for readability and render stability:

- `src/components/theme-toggle.tsx` uses lazy initial state and a single sync effect.
- `src/hooks/use-mobile.ts` resolves initial viewport state immediately.
- `src/components/ui/sidebar.tsx` keeps the open callback stable and persists state without direct cookie assignment.
- `src/lib/sort.ts` centralizes date sorting helpers used across list pages.

## Route Structure

### `/` - Role-based redirect

Redirects authenticated users based on role:

- doctor -> `/doctor-customer`
- all others -> `/salesman/overview`
- unauthenticated -> `/login`

### `/login` - Login form

Email and password form. On success stores JWT and redirects to `/`.

### `/salesman` - Salesman layout

Sidebar layout with nav links. Superadmin users see additional admin nav items.

Child routes:

- `/salesman/overview` - Customer ledger with stat cards.
- `/salesman/invoices` - Invoice table with pagination and date sorting.
- `/salesman/transaction` - Payment lookup by invoice ID.
- `/salesman/inventory` - Inventory activity log table, product creation flow, and inventory update dialog.
- `/salesman/quote` - Quotation creation form and existing quotation list, both driven by query-backed option lists.

### `/admin` - Admin layout

Sidebar layout restricted to superadmin role.

Child routes:

- `/admin/create-user` - Create user form with role selection.
- `/admin/update-user` - User list table and inline edit form.

### `/doctor-customer` - Doctor dashboard

Single-page dashboard showing:

- total spent, total due, total billed, monthly spending
- recent invoices and payment history

## UI Direction

### Theme System

`src/styles.css` uses `@theme inline` with oklch-based CSS custom properties.

Provides shadcn-compatible tokens such as `--background`, `--foreground`, `--card`, `--sidebar`, `--primary`, and `--destructive`. Light and dark mode are driven by the `.dark` class.

Fonts: Inter for body, Montserrat for headings, Fira Code for monospace.

### Components

shadcn/ui components in `src/components/ui/`: button, card, input, label, select, sidebar, separator, sheet, skeleton, table, tooltip.

`src/components/theme-toggle.tsx` handles light and dark switching.

The stylesheet also defines custom font tokens, shadow and radius tokens, and ATI utility classes such as `.ati-frame`, `.ati-kicker`, `.ati-hero-grid`, `.ati-stat-grid`, and `.ati-ledger-line`.

## shadcn Component Layer

The migration uses source-owned shadcn components instead of custom approximations.

Installed components include:

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

Supporting files:

- `src/hooks/use-mobile.ts`
- `src/lib/sort.ts`

## Backend Alignment

The frontend is aligned with the backend routes defined in `arif_trade_international/restAPI/index.php`.

### Public routes

- `GET /health`
- `GET /spec`
- `POST /auth/login`

### Authenticated domains

- Users: `/users`
- Categories: `/categories`
- Products: `/products`
- Variants: `/products/{productId}/variants`, `/variants/{id}`
- Units: `/units`
- Variant units: `/variants/{variantId}/units`, `/variant-units/{id}`
- Customers: `/customers`
- Quotations: `/quotations`, `/quotations/{id}`, `/quotations/{id}/status`
- Invoices: `/invoices`, `/invoices/{id}`
- Payments: `/invoices/{invoiceId}/payments`, `/payments/{id}`
- Inventory log: `/inventory/log`

### Role boundaries

- superadmin: full system management.
- editor: quotation status updates, product maintenance, invoice and payment operations.
- viewer: read-oriented visibility.
- salesman: browse products and submit quotation requests.

## TanStack Query Integration

The repository includes a TanStack Query provider setup:

- `src/integrations/tanstack-query/root-provider.tsx`
- `src/integrations/tanstack-query/devtools.tsx`

The role pages now use query-driven lists and forms where data access matters.

Current cleanup work in `src` focuses on:

- avoiding unnecessary effect-driven state initialization
- reducing unstable callback and context churn
- consolidating dialog state on list-heavy pages
- reusing date sorting logic through `src/lib/sort.ts`

## Files of Interest

### Core app files

- `vite.config.ts`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/login/index.tsx`
- `src/routes/admin/route.tsx`
- `src/routes/salesman/route.tsx`
- `src/routes/doctor-customer/index.tsx`
- `src/routes/salesman/invoices.tsx`
- `src/routes/salesman/inventory.tsx`
- `src/routes/salesman/quote.tsx`
- `src/lib/sort.ts`

### Shared UI shell

- `src/components/app/app-layout.tsx`
- `src/components/theme-toggle.tsx`
- `src/components/ui/sidebar.tsx`
- `src/styles.css`

### Backend references

- `arif_trade_international/restAPI/index.php`
- `arif_trade_international/restAPI/modules/docs/DocsController.php`

## Development Workflow

### Commands

- `bun run dev` to run the frontend locally.
- `bun run build` to generate the static output.
- `bunx biome format --write src` to format source files.
- `bun run check` to run Biome checks.

### Backend startup

The backend remains in `arif_trade_international/restAPI/` and should continue to be started through the repo’s existing local workflow, including `start-dev.sh` when Dockerized services are needed.

## Temporary Auth Bypass (Local Dev)

Use `VITE_DISABLE_AUTH=true` in `.env` to bypass auth checks in the SPA.

When enabled:

- `/` always redirects to `/salesman/overview`
- `/login` is skipped and redirects to `/salesman/overview`
- `/admin/*` route guard is bypassed
- `/doctor-customer` route guard is bypassed
- Salesman sidebar shows admin links for faster local navigation

Affected frontend files:

- `src/lib/auth-flags.ts`
- `src/routes/index.tsx`
- `src/routes/login/index.tsx`
- `src/routes/admin/route.tsx`
- `src/routes/doctor-customer/index.tsx`
- `src/routes/salesman/route.tsx`

## Summary

This frontend is a Vite + TanStack Router SPA with shadcn source components, backend-aligned role layouts, and shared query/state helpers. It preserves static deployment flexibility while matching the real ATI PHP API and business workflow.