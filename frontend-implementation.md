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
The **App Shell** is the persistent frame for all authenticated views. It serves several critical purposes:
- **Protected Layout**: It wraps every internal screen (Dashboard, Users, etc.) providing a unified Sidebar and Topbar.
- **Session Enforcement**: It checks `sessionValue` on mount; if missing, it forces a redirect to `/login`.
- **Navigation Control**: Manages the active state of sidebar links and provides a mobile-responsive "Sheet" menu for smaller devices.
- **Global Actions**: Houses the "Logout" functionality and the user profile dropdown.

### 4. Screen Components (`src/components/app/*-screen.client.tsx`)
Each major feature has its own "Screen" component. These are imported by Astro pages and are the primary "Islands" of interactivity.
- **`dashboard-screen.client.tsx`**: Provides an overview of the system, including API health status and quick-access metrics.
- **`users-screen.client.tsx`**: Implements the users management table. It handles complex client-side features like search filtering alongside server-side role filtering and pagination.
- **`user-form-screen.client.tsx`**: A dual-purpose form for creating and editing users. It uses `URLSearchParams` to detect "Edit Mode" and pre-populate data from the API.

### 5. UI Primitives (`src/components/ui/`)
Standard shadcn/ui components (Buttons, Inputs, Cards, etc.).
- **`field.tsx`**: A highly customized wrapper for `react-hook-form`. It integrates labels, descriptions, and error messages into a single accessible structure (using `fieldset` and `role="alert"`), reducing boilerplate in screen components.

## Routing Strategy

To avoid the overhead of heavy client-side routers (like `react-router`), we use **Astro-native routing**.
- Each `.astro` file in `src/pages/` represents a physical route.
- Each page imports a corresponding `*-page.client.tsx` wrapper.
- These wrappers provide the `AppProviders` context (QueryClient, Auth, Theme) to the specific "Screen" component.
- This results in **multi-page application (MPA)** behavior with the **speed of a single-page application (SPA)** interactivity within each view.

## Component Strategy

- **Astro Pages**: Thin shells importing individual React "Page" components with `client:only="react"`.
- **shadcn/ui**: Modified primitives (e.g., `field.tsx`) to support complex form layouts and accessible error reporting.
- **Icons**: Lucide React for consistent visual language.

## Development

### Environment Setup
Create a `.env` file based on `.env.example`:
```env
PUBLIC_API_BASE_URL=http://localhost/arif_trade_international/restAPI
```

### Commands
- `bun run dev`: Start development server.
- `bun run build`: Generate static production build in `dist/`.
- `bun run format`: Format and lint check via Biome.

## Constraints & Decisions

- **No SSR**: The app is 100% static for simple hosting. All data fetching occurs on the client via React Query.
- **CamelCase**: While the PHP backend uses snake_case, the frontend strictly uses camelCase to match TypeScript idiomatic style.
- **shadcn Overrides**: Custom `Field` component wrapper used in [src/components/ui/field.tsx](src/components/ui/field.tsx) for integrated RHF + Shadcn labels/inputs.
