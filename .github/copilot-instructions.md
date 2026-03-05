# Project Guidelines

## Code Style
- **Biome**: Use `bunx biome check --apply` for formatting and linting. Do not bypass errors.
- **Rules**: [biome.jsonc](biome.jsonc) defines indentation (2 spaces) and import organization.
- **Naming**: PascalCase for [Astro components](src/components/Button.astro) and [UI components](src/components/ui/button.tsx). camelCase for utility functions in [src/lib/utils.ts](src/lib/utils.ts).

## Architecture
- **Full-Stack**: Astro frontend ([src/](src/)) with a custom PHP REST API ([arif_trade_international/restAPI/](arif_trade_international/restAPI/)).
- **Frontend**: [Astro](astro.config.mjs) using Tailwind v4. Reactive components in [src/components/ui/](src/components/ui/) use Shadcn (React).
- **Backend Core**: Lightweight PHP framework in [restAPI/core/](arif_trade_international/restAPI/core/) (Router, JWT, AuthMiddleware).
- **Backend Modules**: Domain logic in [restAPI/modules/](arif_trade_international/restAPI/modules/) (e.g., `products`, `auth`).

## Build and Test
- **Dev**: `bun run dev`
- **Build**: `bun run build`
- **Format**: `bun run format`
- **PHP Tests**: `bash arif_trade_international/restAPI/test_all.sh` or `python3 arif_trade_international/restAPI/test_api.py`

## Project Conventions
- **UI**: Use the `cn()` utility from [src/lib/utils.ts](src/lib/utils.ts) for Tailwind class merging.
- **Astro Components**: Use [src/layouts/main.astro](src/layouts/main.astro) as the base template.
- **API Routing**: Defined in [restAPI/index.php](arif_trade_international/restAPI/index.php). New routes must be registered here.
- **Database**: Schemas and seeds are in [restAPI/sql/](arif_trade_international/restAPI/sql/).

## Integration Points
- **Auth**: [AuthMiddleware.php](arif_trade_international/restAPI/core/AuthMiddleware.php) handles JWT verification.
- **Data Flow**: Frontend pages in [src/pages/](src/pages/) fetch from the PHP API endpoint (set in `restAPI/config.php`).

## Security
- **JWT**: Managed by [JWT.php](arif_trade_international/restAPI/core/JWT.php). Sensitive keys must remain in `.env` (not committed).
- **Validation**: Use [Validator.php](arif_trade_international/restAPI/core/Validator.php) in all PHP controllers.
