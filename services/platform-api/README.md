# Platform API

> A small Express + Drizzle service that backs the demo apps. Demonstrates the "vibe-engineered" backend pattern: typed routes, parameterized queries, rate limiting, and bearer-token auth.

## Tech stack

| Layer | Library |
| ----- | ------- |
| Framework | [Express 4](https://expressjs.com/) |
| ORM | [Drizzle](https://orm.drizzle.team/) (PostgreSQL) |
| Validation | [Zod 4](https://zod.dev/) — centralized `validate(schema)` middleware + per-route schemas in [`src/validators/`](src/validators/) (PR [#349](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/349)) |
| Auth | Bearer token (`PLATFORM_API_TOKEN` env) — see [`src/middleware/auth.ts`](src/middleware/auth.ts) |
| Rate limiting | [`express-rate-limit`](https://www.npmjs.com/package/express-rate-limit) — see PR #290 |
| Logging | [`pino`](https://getpino.io/) + [`pino-http`](https://github.com/pinojs/pino-http) — structured JSON, sensitive-field redaction, dev-mode `pino-pretty` (PR [#350](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/350)) |
| Container | Multi-stage [`Dockerfile`](Dockerfile) — non-root runtime, `pnpm deploy --prod` (PR [#347](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/347)) |
| Tests | Jest + supertest |

## Endpoints

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/health` | None | Database health check |
| `GET` | `/users?limit=20&offset=0` | Bearer token | List users. `limit` defaults to `20` and accepts `1`-`100`; `offset` defaults to `0` and accepts non-negative integers. |

All inputs are validated by Zod schemas in [`src/validators/`](src/validators/) via a centralized `validate(schema)` middleware. See [`src/routes/`](src/routes/) for handler source.

### Authentication

`GET /users` requires `Authorization: Bearer <token>`, where the token matches `PLATFORM_API_TOKEN`. The configured token must be at least 32 characters long. `GET /health` does not require authentication.

### Examples

Check service and database health:

```bash
curl http://localhost:3001/health
```

Successful response (`200`):

```json
{
  "status": "ok",
  "db": "up"
}
```

If the database check fails, the endpoint returns `503`:

```json
{
  "status": "degraded",
  "db": "down",
  "error": "connection refused"
}
```

List up to 20 users, starting after the first 10:

```bash
curl \
  -H "Authorization: Bearer $PLATFORM_API_TOKEN" \
  "http://localhost:3001/users?limit=20&offset=10"
```

Successful response (`200`) is a JSON array, not a pagination wrapper:

```json
[
  {
    "id": 11,
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "createdAt": "2026-07-27T12:00:00.000Z"
  }
]
```

## Quick start

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+
- Docker (optional — to build the production container image)

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

### Docker

```bash
# Build from the repo root
docker build -t platform-api:local -f services/platform-api/Dockerfile .

# Run
docker run --rm -p 3001:3001 \
  -e DATABASE_URL="postgres://user:pass@host:5432/platform_db" \
  -e PLATFORM_API_TOKEN="dev-token" \
  platform-api:local
```

### Logging

Logs are structured JSON (pino). Override the level with `LOG_LEVEL` (default `info`). In `NODE_ENV !== 'production'` the dev server uses `pino-pretty` for human-readable output. Sensitive fields (`password`, `token`, `apiKey`, `authorization`) are redacted automatically. Inside request handlers use `req.log.info(...)` / `req.log.error(...)` to get a logger scoped to the current request id.

## Tests

```bash
pnpm test
```

Tests use a separate `DATABASE_URL` (set in `src/__tests__/setup.ts`). The repo CI runs them via `pnpm --filter platform-api test`.

## See also

- [`services/medical-api`](../medical-api/README.md) — JWT-auth'd healthcare API (PIPA BC)
- [Root README](../../README.md) — monorepo overview
