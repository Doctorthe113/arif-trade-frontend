# Frontend Implementation: ATI Control Center

Phase 1 implementation of the Arif Trade International (ATI) medical operations admin dashboard.

## Architecture

- **Framework**: Astro 5 (Static Output).
- **Interactivity**: React 19 Client Islands.
- **Styling**: Tailwind CSS v4 + shadcn/ui.
- **State Management**: React Query (fetching/caching) + React Hook Form (forms).
- **Type Safety**: TypeScript (strict) + Zod (validation).

## Core Modules & Directory Structure

### 1. API & Data Layer (`src/lib/`)
- **`api-client.ts`**: The central communication hub. It uses a generic `apiRequestValue` function to handle headers, JSON parsing, and error normalization. It includes a proactive **401 Interceptor**: if a request fails due to an expired token, it attempts a silent refresh via `/auth/refresh` before retrying or redirecting to login.
- **`api-types.ts`**: Strict TypeScript definitions for all domain entities. By defining these first, we ensure type safety across the entire application.
- **`api-mappers.ts`**: A mapping layer that sanitizes backend data. It converts snake_case keys (e.g., `is_active`) to camelCase (e.g., `isActiveValue`), isolating API-specific naming conventions from the rest of the app logic.
- **`app-config.ts`**: Handles routing constants and environment variable resolution. It ensures `PUBLIC_API_BASE_URL` is present at build time, preventing runtime "undefined" API calls.
- **`auth-storage.ts`**: Manages `localStorage` interactions, including session versioning to prevent state corruption across app updates.

### 2. Authentication (`src/components/app/auth-context.client.tsx`)
- **`AuthProvider`**: A React Context provider that wraps the app to provide `sessionValue` and `currentUserValue`. It synchronizes the auth state with `localStorage` and provides hooks like `useAuthValue()` and `useLoginMutationValue()`.

### 3. Application Shell (`src/components/app/app-shell.client.tsx`)
The **App Shell** is the persistent frame for all authenticated views.
- **Protected Layout**: It wraps all internal screens in a shared base layout built from shadcn sidebar primitives.
- **Session Enforcement**: It checks `sessionValue` on mount; if missing, it redirects to `/login`.
- **Persistent Navigation**: The sidebar and header stay mounted while only the content pane changes.
- **Global Actions**: It keeps the user summary and logout action inside the sidebar footer.

### 4. Application Router (`src/components/app/app-router.client.tsx`)
- **Client-side navigation**: Authenticated routes (`/dashboard`, `/users`, `/user-form`) are handled by a lightweight history-based router.
- **Shared shell**: Route changes update the content pane without tearing down the shell.
- **Direct route support**: Astro pages still exist for each URL so refresh and direct loads continue to work in static hosting.

### 5. Screen Components (`src/components/app/*-screen.client.tsx`)
Each major feature has its own screen component. These are now content views rendered inside the shared shell.
- **`dashboard-screen.client.tsx`**: Provides an operational overview focused on backend connectivity and admin actions. JWT/session internals are no longer exposed on the home screen.
- **`users-screen.client.tsx`**: Implements the users management table. It handles complex client-side features like search filtering alongside server-side role filtering and pagination.
- **`user-form-screen.client.tsx`**: A dual-purpose form for creating and editing users. It reads the current client-route search params to detect edit mode and pre-populate data from the API.

### 6. UI Primitives (`src/components/ui/`)
Standard shadcn/ui components (Buttons, Inputs, Cards, Sidebar, etc.).
- **`field.tsx`**: A highly customized wrapper for `react-hook-form`. It integrates labels, descriptions, and error messages into a single accessible structure (using `fieldset` and `role="alert"`), reducing boilerplate in screen components.
- **`sidebar.tsx`**: The shadcn sidebar foundation used by the authenticated workspace layout.

## Routing Strategy

Authenticated app routes now use a **hybrid Astro + client-router model**.
- Each `.astro` file in `src/pages/` still exists as a physical route for static output and direct loads.
- `/dashboard`, `/users`, and `/user-form` all mount the same authenticated React entrypoint.
- Inside that entrypoint, a lightweight history-based router updates content with `pushState` and `popstate` instead of full page reloads.
- `/login` remains a separate route outside the authenticated shell.

## Component Strategy

- **Astro Pages**: Thin shells importing the authenticated app entrypoint or the login entrypoint with `client:only="react"`.
- **shadcn/ui**: Modified primitives plus the shadcn sidebar for the persistent workspace frame.
- **Icons**: Lucide React for consistent visual language.

## Development

### Environment Setup
Create a `.env` file based on `.env.example`:
```env
PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

### Commands
- `./start-dev.sh`: Start Dockerized Apache backend and MySQL.
- `bun run dev`: Start development server.
- `bun run build`: Generate static production build in `dist/`.
- `bun run format`: Format and lint check via Biome.

## Constraints & Decisions

- **No SSR**: The app is 100% static for simple hosting. All data fetching occurs on the client via React Query.
- **CamelCase**: While the PHP backend uses snake_case, the frontend strictly uses camelCase to match TypeScript idiomatic style.
- **shadcn Overrides**: Custom `Field` component wrapper used in [src/components/ui/field.tsx](src/components/ui/field.tsx) for integrated RHF + Shadcn labels/inputs.
- **No session telemetry on home**: JWT and session mechanics stay internal to auth and API layers. The dashboard now shows operational workspace information instead.
