# Project Guidelines

## Core & General Rules
- **Concision**: Be extremely concise, sacrifice grammar. No emoji.
- **Comments**: One-liners only (4-5 words max) on functions.
- **Variables**: Include units (e.g., `returnRatePercent` not `returnRate`).
- **Type Safety**: Avoid `any`. Use `type` over `interface`.
- **Package Manager**: `bun`/`bunx` only (not npm/yarn/npx).
- **Linting**: Biomejs (not eslint). Do not bypass errors.
- **Currency**: Use ৳ symbol (not $ or ₹).
- **Platform**: Ask if unclear native vs web. Keep platform code in respective folders.
- **Naming**:
  - Routes: kebab-case (e.g., `/mutual-fund`).
  - Components/helpers: kebab-case filenames.
  - Server components: `.server.tsx` suffix. Client: `.client.tsx`.
  - Route-specific components in route folder; reusable ones in `components/`.

## Code Style
- **Biome**: Use `bunx biome check --apply` for formatting and linting. Do not bypass errors.
- **Rules**: [biome.jsonc](biome.jsonc) defines indentation (2 spaces) and import organization.
- **Naming**: camelCase for [Astro components](src/components/Button.astro), [UI components](src/components/ui/button.tsx) and for utility functions in [src/lib/utils.ts](src/lib/utils.ts).

## Architecture
- **Full-Stack**: Astro frontend ([src/](src/)) with a custom PHP REST API ([arif_trade_international/restAPI/](arif_trade_international/restAPI/)).
- **Frontend Strategy**: 100% Static (No SSR). Client-only React islands on top of Astro layout shell.
- **Tech Stack**: Astro 5 + React 19 + Tailwind v4 + shadcn/ui.
- **Data Fetching**: Use `@tanstack/react-query` within React. Astro frontmatter purely for metadata/layout; no server-side fetching.
- **Forms**: Use `react-hook-form` + `@hookform/resolvers/zod`. Standardize on custom `Field` wrapper in `src/components/ui/field.tsx`.
- **Backend Core**: Lightweight PHP framework in [restAPI/core/](arif_trade_international/restAPI/core/) (Router, JWT, AuthMiddleware). DO NOT TOUCH BACKEND CODE
- **Backend Modules**: Domain logic in [restAPI/modules/](arif_trade_international/restAPI/modules/) (e.g., `products`, `auth`).

## Build and Test
- **Dev**: `bun run dev`
- **Build**: `bun run build` (Static output to `dist/`)
- **Format**: `bun run format` (Biome based)
- **PHP Tests**: `bash arif_trade_international/restAPI/test_all.sh` or `python3 arif_trade_international/restAPI/test_api.py`

## Project Conventions
- **UI**: Use the `cn()` utility from [src/lib/utils.ts](src/lib/utils.ts) for Tailwind class merging. Use shadcn components.
- **Astro Components**: Use [src/layouts/main.astro](src/layouts/main.astro) as the base template.
- **Naming**: Route-specific screens in `src/components/app/` as `name-screen.client.tsx`. Page entry wrappers as `name-page.client.tsx`.
- **API Mapping**: Translate backend snake_case to frontend camelCase in `src/lib/api-mappers.ts`.

## Integration Points
- **Auth**: Client-only JWT managed in `src/components/app/auth-context.client.tsx`. Persistent via `localStorage`.
- **Data Flow**: Frontend pages fetch from PHP API. `PUBLIC_API_BASE_URL` resolved at build-time via `.env`.
- **CORS**: Requires backend configuration for front-end origin in production.

## Security
- **JWT**: Managed by [JWT.php](arif_trade_international/restAPI/core/JWT.php). Sensitive keys must remain in `.env` (not committed).
- **Validation**: Use [Validator.php](arif_trade_international/restAPI/core/Validator.php) in all PHP controllers.
