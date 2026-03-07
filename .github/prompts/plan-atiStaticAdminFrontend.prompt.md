## Plan: ATI static admin frontend

DRAFT. Build a static Astro admin app, client-only for data and auth. Astro stays route/layout shell, React islands handle all interactive UI, React Query handles browser fetching/caching, React Hook Form + Zod + shadcn `Field` pattern handles forms. Backend already exposes usable JWT auth, role-protected routes, and stable entity groups via [arif_trade_international/restAPI/index.php](arif_trade_international/restAPI/index.php#L66-L146), [arif_trade_international/restAPI/modules/auth/AuthController.php](arif_trade_international/restAPI/modules/auth/AuthController.php#L9-L79), and [arif_trade_international/restAPI/modules/docs/DocsController.php](arif_trade_international/restAPI/modules/docs/DocsController.php#L10-L33). Phase 1 goes deep on auth, app shell, and users/roles; products, inventory, quotations, customers, invoices, and payments stay in the roadmap. Auth persistence will use `localStorage`. No SSR: use `client:only="react"` islands and keep Astro output fully static.

**Steps**
1. Establish static frontend architecture around the existing Astro scaffold in [astro.config.mjs](astro.config.mjs), [src/layouts/main.astro](src/layouts/main.astro#L1-L15), [src/pages/index.astro](src/pages/index.astro#L1-L23), and [components.json](components.json#L1-L22). Normalize on [src/layouts/main.astro](src/layouts/main.astro#L1-L15) as base shell, remove demo-only assumptions from [src/pages/index.astro](src/pages/index.astro#L1-L23), keep `rsc: false`, and render interactive app sections through client-only React islands.

2. Add frontend runtime dependencies for the chosen stack: React Query, React Hook Form, Zod, and RHF resolvers, then create a small client app foundation under shared frontend folders. Plan shared files for `query-client`, provider composition, auth store, query keys, DTO types, and formatters beside [src/lib/utils.ts](src/lib/utils.ts#L1-L5). Keep naming aligned with project conventions, but pick one rule consistently since [AGENTS.md](AGENTS.md) currently conflicts on kebab-case vs camelCase.

3. Create a browser-only API layer that matches backend response and auth rules from [arif_trade_international/restAPI/core/Response.php](arif_trade_international/restAPI/core/Response.php#L16-L35), [arif_trade_international/restAPI/modules/auth/AuthController.php](arif_trade_international/restAPI/modules/auth/AuthController.php#L9-L79), and [arif_trade_international/restAPI/modules/docs/DocsController.php](arif_trade_international/restAPI/modules/docs/DocsController.php#L10-L33). Include:
   - API base URL from public env
   - envelope parsing for `success`, `message`, `data`, `errors`
   - Bearer token injection
   - 401 handling with `POST /auth/refresh`
   - client logout by clearing storage only, since no revoke endpoint exists
   - safe query/mutation helpers for React Query

4. Build app-level providers and guards as React client components mounted from Astro pages. Plan a top-level `providers` component containing `QueryClientProvider`, auth bootstrap, toast system, and route guard logic. Use `client:only="react"` for protected surfaces so no user data or auth state is rendered on the server. Keep all data fetching inside React, per your requirement.

5. Build the phase 1 route shells in Astro:
   - login page
   - protected dashboard shell
   - users list page
   - user create/edit page
   - fallback unauthorized/not-found states
   Astro handles page markup and metadata; each page mounts a single React screen/island. This fits static hosting and keeps routing simple without adding a SPA router.

6. Create the reusable shadcn UI surface first, because current UI inventory is nearly empty in [src/components/ui/button.tsx](src/components/ui/button.tsx) and [src/components/ui](src/components/ui). Plan to add the minimum primitives needed for phase 1: `input`, `textarea`, `label`, `select`, `dialog`, `sheet`, `card`, `badge`, `table`, `dropdown-menu`, `separator`, `skeleton`, `alert`, `avatar`, `sonner`, plus shadcn form primitives matching your pasted RHF docs: `field`, `field-group`, `field-error`, and related composition pieces if the installed registry exposes them.

7. Standardize forms around React Hook Form + Zod + shadcn `Controller`/`Field` composition. For phase 1, define schemas and components for:
   - login form
   - create user form
   - edit user form
   - filter/search controls for users
   Use `data-invalid` on `Field`, `aria-invalid` on controls, and keep submit/reset/error states consistent. This follows your supplied shadcn RHF pattern and avoids ad hoc form markup.

8. Implement auth UX against actual backend contracts:
   - login via `POST /auth/login`
   - bootstrap current user via `GET /auth/me`
   - silent token renewal via `POST /auth/refresh`
   - role-aware guards for `superadmin`, `editor`, `viewer`, `salesman` from [arif_trade_international/restAPI/sql/001_schema.sql](arif_trade_international/restAPI/sql/001_schema.sql#L15-L29) and [arif_trade_international/restAPI/modules/docs/DocsController.php](arif_trade_international/restAPI/modules/docs/DocsController.php#L21-L33)
   Plan UI states for expired token, disabled account, and unauthorized role entry.

9. Design the admin shell in the chosen “clean medical dashboard” direction. Use [src/styles/global.css](src/styles/global.css#L1-L127) theme tokens, extend them for a sharper medical/admin palette, and compose:
   - left sidebar for modules
   - topbar with user/account state
   - summary cards on dashboard
   - clean data tables with search/filter/status badges
   Keep the visual system calm, clinical, and dense enough for operations, not marketing.

10. Build phase 1 screens in detail:
    - dashboard overview: authenticated welcome, role badge, quick links, health/spec connectivity status
    - users index: paginated table wired to `GET /users`, role filter, status badge, empty/loading/error states
    - user create: `POST /users`
    - user edit: `GET /users/{id}` + `PUT /users/{id}`
    - user delete: `DELETE /users/{id}` with confirmation dialog
    Respect backend permissions from [arif_trade_international/restAPI/index.php](arif_trade_international/restAPI/index.php#L72-L78).

11. Add shared data-table and mutation patterns for later modules so phase 2+ stays consistent. Define reusable table state, pagination parsing, URL query syncing, server error rendering, badge mapping, and currency/date helpers using ৳. This will be reused for products, quotations, invoices, payments, and inventory logs.

12. Queue later roadmap modules based on discovered backend groups in [arif_trade_international/restAPI/index.php](arif_trade_international/restAPI/index.php#L80-L146) and schema in [arif_trade_international/restAPI/sql/001_schema.sql](arif_trade_international/restAPI/sql/001_schema.sql#L34-L269):
    - Phase 2: categories, units, products, variants, variant-units
    - Phase 3: quotations request/accept/returned flow and inventory log surfaces
    - Phase 4: customers, invoices, payments, due tracking, printable slip/bill views
    Design each around the real status lifecycle: quotation `pending/accepted/returned/rejected`, invoice `active/returned/void`, inventory actions `handover/sold/returned`.

13. Plan print-friendly UI later as dedicated static routes/screens for slips and invoices, fed client-side from invoice/customer data. Use browser print styles, not SSR PDF generation, so deployment remains GitHub Pages-friendly.

14. Add static-hosting safeguards:
    - ensure Astro stays static-only
    - use relative asset-safe routing for GitHub Pages
    - keep API origin configurable via public env
    - document that CORS must exist on the PHP host if frontend and backend are on different origins
    This is the main external blocker for a pure static deployment.

15. Update project instructions after implementation by appending the new frontend rules to [AGENTS.md](AGENTS.md): RHF + shadcn forms, React Query for data fetching, Astro-first markup, React for responsive client components, no SSR, static-hosting target. This should happen after the frontend structure is actually in place so docs match reality.

**Verification**
- Install deps with `bun`.
- Format/lint with `bunx biome check --apply`.
- Build static output with `bun run build`.
- Manually verify:
  - login, refresh, logout flow
  - protected route guard behavior by role
  - users CRUD against live backend
  - full page refresh keeps session via `localStorage`
  - all fetching happens client-side only
  - no SSR-only code paths
  - static build works with a configurable public API URL
- Confirm backend connectivity via `/health` and `/spec`.

**Decisions**
- Use Astro for static route/layout shells, React islands for all interactive screens.
- Use `client:only="react"` for protected/data-driven surfaces to keep app browser-only.
- Use React Query for all fetching/mutations; no Astro server data loading.
- Use React Hook Form + Zod + shadcn `Field` composition for every form.
- Use `localStorage` for JWT persistence.
- Phase 1 scope: auth, app shell, users/roles. Full business workflow remains as later roadmap.
- Do not touch backend; integrate against current PHP REST API only. If you need a change, write it down in `backend-issues.md` and we can triage it for a future phase. and after you are done, write a detailed description of the implementation in `frontend-implementation.md` for future reference. If you have made any placeholder, create a `TODO.md` file and list them there with details on what needs to be done, so we can keep track of pending work.
