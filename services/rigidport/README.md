# RigidPort

A full-stack ASP.NET Core 9 logistics demo (Razor Pages for the operator UI + minimal-API endpoints for programmatic access). Backed by EF Core (SQLite) with Chart.js dashboards.

## Tech stack

| Layer | Library |
| ----- | ------- |
| Framework | ASP.NET Core 9 (Razor Pages + minimal APIs) |
| ORM | EF Core 9 (SQLite) |
| Auth | Cookie auth (Razor Pages) + `X-API-Key` middleware (minimal APIs) — PR [#351](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/351) |
| Rate limiting | Built-in ASP.NET Core rate limiter — PR [#290](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/290) |
| Tests | xUnit + `WebApplicationFactory<Program>` |

## Quick start

Prerequisites: .NET 9 SDK.

```bash
# Build & test
dotnet build services/rigidport/RigidPort.sln
dotnet test  services/rigidport/RigidPort.Tests/RigidPort.Tests.csproj

# Run the web app (listens on http://localhost:5000 by default)
dotnet run --project services/rigidport/RigidPort.Web
```

## Authentication

RigidPort uses two authentication modes:

- **Razor Pages** use cookie authentication. Sign in at `/Auth/Login` with username `admin`; set `RIGIDPORT_ADMIN_PASSWORD` for the password. If unset, development falls back to `admin`. Sign out at `/Auth/Logout`; unauthorized access is redirected to `/Auth/AccessDenied`. Anonymous pages: landing (`/`), `/Privacy`, `/Error`, and the auth pages themselves.
- **Minimal API routes** under `/api/` require an `X-API-Key` header. Set `ALLOWED_API_KEY` to the allowed key. If unset, development falls back to `dev-api-key-change-me`. The middleware uses `CryptographicOperations.FixedTimeEquals` for constant-time comparison.

Example minimal API call:

```bash
curl -H "X-API-Key: dev-api-key-change-me" http://localhost:5000/api/shipments/search
```

## Environment variables

| Variable | Purpose | Dev default |
| -------- | ------- | ----------- |
| `RIGIDPORT_ADMIN_PASSWORD` | Password for the seeded `admin` Razor Pages user | `admin` |
| `ALLOWED_API_KEY` | Accepted value for the `X-API-Key` header on `/api/*` routes | `dev-api-key-change-me` |

## Tests

`RigidPort.Tests/Helpers/CustomWebApplicationFactory.cs` registers a `TestAuthHandler` so integration tests can call `[Authorize]` endpoints without going through cookie login, and pre-sets `ALLOWED_API_KEY=test-key` so API tests can send `X-API-Key: test-key`. The suite currently runs **48/48** tests green.
