# Vibe Engineering Demo (Monorepo Edition) 🚀

This project demonstrates the transition from "Single Player Vibe Coding" to "Multiplayer Vibe Engineering". It is a **Turborepo** monorepo containing frontend applications, shared packages, and backend microservices.

## Tech Stack

| Layer               | Technology                                                              |
| ------------------- | ----------------------------------------------------------------------- |
| **Package Manager** | pnpm 10.x                                                               |
| **Build System**    | Turborepo                                                               |
| **Frontend**        | Next.js 15 (App Router), React 19, Tailwind CSS 4                       |
| **Backend**         | Node.js, Express.js, Hono, Drizzle ORM, Zod 4                           |
| **Logging**         | pino + pino-http (structured JSON logs in services)                     |
| **Containers**      | Multi-stage Dockerfiles for `medical-api` & `platform-api`              |
| **Database**        | PostgreSQL                                                              |
| **AI Integration**  | GitHub Copilot SDK (`@github/copilot-sdk`)                              |
| **.NET Service**    | ASP.NET Core 9 (Razor Pages + minimal APIs) — `rigidport`               |
| **Testing**         | Jest, React Testing Library, @swc/jest, xUnit (.NET)                    |

## Repository Structure

```
contoso-vibe-engineering/
├── apps/                      # Frontend applications
│   ├── contoso-web-app/       # Vibe Engineering demo (legacy vs. secure)
│   ├── octocat-blog-app/      # GitHub-themed blog with PostgreSQL
│   └── octocat-support-app/   # AI-powered support ticket portal
├── packages/                  # Shared libraries & config
│   ├── ui/                    # Shared design system (shadcn/ui)
│   ├── eslint-config/         # Shared ESLint configurations
│   └── typescript-config/     # Shared TypeScript configurations
├── services/                  # Backend microservices (deployed independently)
│   ├── platform-api/          # Core platform API (Express + Drizzle)
│   ├── medical-api/           # Medical data API (PIPA-compliant)
│   ├── ai-tool-digest/        # AI tool digest Azure Function
│   └── rigidport/              # Full-stack ASP.NET Core 9 logistics platform (Razor Pages, EF Core SQLite, Chart.js)
└── infra/                     # Infrastructure-as-code (Terraform)
```

## Applications

### Contoso Web App (`apps/contoso-web-app`)

Demonstrates the core "Vibe Engineering" philosophy side-by-side:

- **Legacy Vibe** (`app/legacy-vibe/`) — Hardcoded styles, SQL injection vulnerabilities, no validation.
- **Secure Vibe** (`app/secure-vibe/`) — Uses `@workspace/ui`, Drizzle ORM, and Zod validation. Returns only safe DTOs.

### Octocat Blog App (`apps/octocat-blog-app`)

A GitHub-themed blog for discussing releases, features, and changelog updates. Built with PostgreSQL, Drizzle ORM, and full Server Components. See [its README](apps/octocat-blog-app/README.md) for details.

### Octocat Support App (`apps/octocat-support-app`)

An AI-powered support ticket portal that converts user-submitted tickets into structured GitHub Issues. Features dual triage modes — AI triage via GitHub Copilot SDK and template-based direct triage. See [its README](apps/octocat-support-app/README.md) for details.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+ (the repo pins `pnpm@10.26.2` via `packageManager`)
- PostgreSQL (for apps that require a database)
- .NET 9 SDK (only required if working on `services/rigidport`)
- Docker (optional — for building service container images)

### Installation

```bash
# Clone the repository
git clone https://github.com/VeVarunSharma/contoso-vibe-engineering.git
cd contoso-vibe-engineering

# Install all dependencies
pnpm install

# Run all apps in development mode
pnpm dev
```

### Available Scripts

| Script       | Description                        |
| ------------ | ---------------------------------- |
| `pnpm dev`   | Start all apps in development mode |
| `pnpm build` | Build all apps and packages        |
| `pnpm lint`  | Run linting across the monorepo    |
| `pnpm typecheck` | Type-check the whole monorepo  |
| `pnpm test`  | Run tests across the monorepo      |

### Dev Servers

| App                 | URL                                            |
| ------------------- | ---------------------------------------------- |
| Contoso Web App     | [http://localhost:3000](http://localhost:3000) |
| Octocat Blog App    | [http://localhost:3001](http://localhost:3001) |
| Octocat Support App | [http://localhost:3002](http://localhost:3002) |
| RigidPort           | [http://localhost:5100](http://localhost:5100) |

## Configuration

The rules for the AI Agent are defined in [.github/copilot-instructions.md](.github/copilot-instructions.md).

## What's Been Hardened

This repository was the subject of an end-to-end **vibe-engineering triage** sprint. All P0 (critical) and P1 (high-priority) issues have been resolved through the following themed PRs — each one independently reviewable and shipped against a milestone:

| PR | Theme | Closes | Milestone |
| --- | --- | --- | --- |
| [#283](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/283) | Repo hygiene — remove accidental artifacts and stale README references | (housekeeping) | — |
| [#285](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/285) | Fix broken root tooling and missing UI package exports | #225, #226, #235 | P0 Security Baseline |
| [#288](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/288) | Fix XSS in blog markdown rendering and sanitize support-app issue body | #220, #224 | P0 Security Baseline |
| [#289](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/289) | Add real JWT auth to medical-api and bearer auth to platform-api | #221, #222 | P0 Security Baseline |
| [#290](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/290) | Add rate limiting to all 4 services | #223 | P0 Security Baseline |
| [#291](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/291) | Fix CI security gates and add support-app workflow | #233, #234 | P1 CI & Testing Baseline |
| [#292](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/292) | Add backend service tests (medical-api, platform-api, ai-tool-digest) | #228, #229, #232 | P1 CI & Testing Baseline |
| [#293](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/293) | Add frontend Jest tests (UI package, support-app, contoso-web-app) | #227, #230, #231 | P1 CI & Testing Baseline |

### Highlights

- **XSS fix in blog markdown renderer** — replaced regex parser with `marked` + `isomorphic-dompurify`.
- **Real JWT authentication** — replaced spoofable `X-User-Id` / `X-User-Role` headers in `medical-api` with HS256 JWTs via `jose`; added bearer middleware to `platform-api`.
- **Rate limiting on every service** — Express, Hono, ASP.NET Core, and Azure Functions all now have per-IP limits.
- **CI security gates that actually fail** — removed silent `continueOnError` in the Azure Pipeline security scan and added a GitHub Actions workflow for the support-app.
- **Test coverage from zero → real** — backend services and frontend packages now have Jest test suites with happy-path, validation-failure, and auth-failure coverage.

### P2 / P3 Backlog Sweep (latest wave)

The P2/P3 backlog has now been driven to zero through a second wave of focused PRs:

| PR | Theme | Closes |
| --- | --- | --- |
| [#344](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/344) | Fix duplicated minimal-API block in `rigidport/Program.cs` (CodeQL CS8803) | (hotfix) |
| [#345](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/345) | PIPA BC research de-identification in `medical-api` | #259 |
| [#346](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/346) | Production Dockerfile for `medical-api` | #250 |
| [#347](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/347) | Production Dockerfile for `platform-api` | #251 |
| [#348](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/348) | Real security alerting in `medical-api` audit middleware | #258 |
| [#349](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/349) | Zod input validation + `/users` pagination in `platform-api` | #253 |
| [#350](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/350) | Structured logging with `pino` in `platform-api` | #264 |
| [#351](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/351) | Cookie auth + `X-API-Key` middleware for `rigidport` | #254 |
| [#352](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/352) | Workspace-wide Zod 3 → 4 migration | #208 |

**Net effect:**

- All Node services now ship a multi-stage **Dockerfile** with non-root runtime and `pnpm deploy --prod` output.
- `platform-api` emits **structured JSON logs** via pino with sensitive-field redaction and request-scoped `req.log`.
- `medical-api` writes audit-trail **security alerts** to an optional `ALERT_WEBHOOK_URL` (or stderr) and **de-identifies research-purpose responses** (drops direct identifiers, generalizes DOB to birth year, postal code to FSA).
- `rigidport` now requires cookie auth for Razor Pages and `X-API-Key` for minimal APIs; 48/48 xUnit tests pass via a `TestAuthHandler`.
- The entire workspace is on **Zod 4** (`^4.4.x`) — uniform error handling (`ZodError.issues`), top-level `z.email()` / `z.url()` validators, and consistent schema composition (`.extend()` over `.merge()`).

The current backlog is **0 open issues, 0 open PRs**.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run `pnpm lint` and `pnpm test`
4. Submit a pull request

## License

MIT
