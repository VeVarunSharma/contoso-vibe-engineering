# Vibe Engineering Demo (Monorepo Edition) 🚀

This project demonstrates the transition from "Single Player Vibe Coding" to "Multiplayer Vibe Engineering". It is a **Turborepo** monorepo containing frontend applications, shared packages, and backend microservices.

## Tech Stack

| Layer               | Technology                                        |
| ------------------- | ------------------------------------------------- |
| **Package Manager** | pnpm                                              |
| **Build System**    | Turborepo                                         |
| **Frontend**        | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| **Backend**         | Node.js, Express.js, Drizzle ORM, Zod             |
| **Database**        | PostgreSQL                                        |
| **AI Integration**  | GitHub Copilot SDK (`@github/copilot-sdk`)        |
| **Testing**         | Jest, React Testing Library, @swc/jest            |

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
│   ├── dotnet-to-angular-agent/ # Migration agent
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
- pnpm 8+
- PostgreSQL (for apps that require a database)

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

Outstanding **P2 / P3** issues are tracked under their respective milestones.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run `pnpm lint` and `pnpm test`
4. Submit a pull request

## License

MIT
