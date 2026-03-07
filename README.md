# ATI static admin frontend

Static Astro admin app. Client-only auth/data. React islands for interactive UI. React Query for fetching. React Hook Form + Zod + shadcn for forms.

## Env

Backend URL is build-time resolved from public env:

```sh
PUBLIC_API_BASE_URL=http://localhost/arif_trade_international/restAPI
```

Create one of these before build:

- `.env`
- `.env.production`

`.env` files are ignored. Keep `.env.example` as template.

## Commands

```sh
bun run dev
bun run build
bun run format
bun run lint
```
