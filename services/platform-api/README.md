# Platform API

> A small Express + Drizzle service that backs the demo apps. Demonstrates the "vibe-engineered" backend pattern: typed routes, parameterized queries, rate limiting, and bearer-token auth on mutations.

## Tech stack

| Layer | Library |
| ----- | ------- |
| Framework | [Express 4](https://expressjs.com/) |
| ORM | [Drizzle](https://orm.drizzle.team/) (PostgreSQL) |
| Validation | [Zod](https://zod.dev/) |
| Auth | Bearer token (`PLATFORM_API_TOKEN` env) — see [`src/middleware/auth.ts`](src/middleware/auth.ts) |
| Rate limiting | [`express-rate-limit`](https://www.npmjs.com/package/express-rate-limit) — see PR #290 |
| Tests | Jest + supertest |

## Endpoints

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/health` | none | Liveness probe |
| `GET` | `/users` | none | List users (safe DTO — no password hashes) |
| `POST` | `/users` | Bearer | Create a user |

See [`src/routes/`](src/routes/) for full handler source.

## Quick start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Environment

Copy [`.env.example`](.env.example) to `.env` and fill in your database URL & auth token.

### Database setup

```bash
cd services/platform-api
pnpm db:generate    # generate Drizzle migrations from schema
pnpm db:migrate     # apply migrations to the database
pnpm db:seed        # seed with sample users (uses @faker-js/faker)
```

### Run

```bash
pnpm dev      # tsx watch
pnpm build    # tsc
pnpm start    # node dist/index.js
```

Service listens on **http://localhost:3001** by default (override with `PORT`).

## Tests

```bash
pnpm test
```

Tests use a separate `DATABASE_URL` (set in `src/__tests__/setup.ts`). The repo CI runs them via `pnpm --filter platform-api test`.

## See also

- [`services/medical-api`](../medical-api/README.md) — JWT-auth'd healthcare API (PIPA BC)
- [Root README](../../README.md) — monorepo overview
