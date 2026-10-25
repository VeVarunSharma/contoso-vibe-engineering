# Contoso Vibe Engineering

Turn a support report into a reviewable engineering handoff, using a reusable Next.js application in this Turborepo monorepo.

![A completed local support handoff showing the issue title, suggested labels, downloadable Markdown, and engineering review checklist](docs/images/support-handoff.png)

_Actual local execution with synthetic data. The result is a Markdown handoff, not a created GitHub issue._

## One customer journey

**For a support analyst and an engineering triage lead:** reduce the missing context between "a customer reported a problem" and "engineering can decide what to do."

In **Octocat Support**, describe the problem, review a structured draft and its label rules, then download the evidence and follow-up checklist. The included order-search report is fictional; no order system is connected. A person still verifies impact, reproduction, and ownership.

The default path needs **no credentials, database, cloud resources, or model calls**. Optional live GitHub publishing remains available behind explicit configuration and confirmation. AI triage is optional, not implied by a template preview.

## Getting Started

Prerequisites: Node.js 20+ and the repository-pinned **pnpm 10.26.2**. The commands below are PowerShell, run from the repository root after cloning.

```powershell
git clone https://github.com/VeVarunSharma/contoso-vibe-engineering.git
Set-Location contoso-vibe-engineering
pnpm install --frozen-lockfile --filter octocat-support-app...
$env:SUPPORT_MODE = "preview"
$env:NEXT_TELEMETRY_DISABLED = "1"
pnpm --filter octocat-support-app dev
```

Open **http://127.0.0.1:3002**. Select **Use sample report**, **Review issue draft**, then **Download handoff**. Open `support-handoff.md` and identify the engineering owner and unanswered questions. **Start another report** resets the in-memory rehearsal; it does not delete downloads or GitHub issues.

Already using port 3002? Choose an unused port:

```powershell
pnpm --filter octocat-support-app exec next dev --hostname 127.0.0.1 --port 3102
```

The first install needs registry access. Setup timing depends on the machine and package cache; the [presenter guide](docs/support-demo.md#reproduce-and-validate) explains how to measure a handoff rather than promising a universal setup time.

## Demonstrate, adapt, understand

- **[Five-minute demonstration and customer conversation](docs/support-demo.md)**: observable checkpoints, recovery, discovery questions, and a bounded pilot.
- **[Adapt the journey](docs/support-demo.md#adapt-it)**: reusable pieces, customer-specific rules, branding, and permissions.
- **[Application setup and API boundaries](apps/octocat-support-app/README.md)**: preview versus live operation, configuration, and exact validation commands.
- **[Shared UI](packages/ui/README.md)**: reuse the existing design system rather than copying components.

## Applications

The support journey is the recommended starting point, not a replacement for the other examples.

| Area                                                  | Purpose / entry point                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [Octocat Support](apps/octocat-support-app/README.md) | Support report to engineering handoff; optional GitHub/Copilot integration               |
| [Contoso Web App](apps/contoso-web-app)               | Deliberately contrasting legacy and secure implementation patterns                       |
| [Octocat Blog](apps/octocat-blog-app/README.md)       | PostgreSQL/Drizzle-backed blog                                                           |
| [Services](services)                                  | Independently operated platform-api, medical-api, ai-tool-digest, and RigidPort examples |
| [Infrastructure](infra)                               | Existing infrastructure-as-code; not needed for local rehearsal                          |

## Important boundaries

This is demonstration software, **not an official support service or a production-ready help desk**. Use synthetic or approved data. Reporter details are included in exports and, when explicitly published, in GitHub issues. Security concerns are export-only and must use an approved private reporting channel.

Keep local servers on loopback. The portal does not provide authentication, cross-request deduplication, persistence, automatic team assignment, or SLAs. Do not expose the intentionally vulnerable legacy examples publicly. No customer deployments, savings, adoption, or independent SE validation are claimed.

## Configuration

Agent conventions remain in [.github/copilot-instructions.md](.github/copilot-instructions.md). Other apps and services have their own prerequisites; PostgreSQL, Docker, and the .NET 9 SDK are **not required** for the support rehearsal.

## Automation Noise Controls

Existing automation launch, deduplication, and comment budgets are described in [Workflow Noise Reduction](docs/workflow-noise-reduction.md).

## Pull Request Auto-Merge

For operational gates, readiness, and native auto-merge behavior, use [Dark Factory Operations](docs/dark-factory.md). Local demo execution does not enable automation or publish repository changes.

## Dark Factory

The opt-in issue-delivery control plane is documented in [Dark Factory Operations](docs/dark-factory.md) and [Dark Factory Enterprise Architecture](docs/dark-factory-architecture.md). Those workflows are separate from the customer-facing support journey.

<details>
<summary>Engineering history and existing implementation references</summary>

## Tech Stack

The monorepo uses pnpm/Turborepo, Next.js 15, React 19, Tailwind CSS 4, shared shadcn/ui components, and Jest with React Testing Library and SWC. Backend examples use Express/Hono, Drizzle, PostgreSQL, and pino; RigidPort uses ASP.NET Core 9, Razor Pages, EF Core SQLite, Chart.js, and xUnit. Services are deployed independently of the frontend build pipeline.

## Repository Structure

`apps/` contains the three frontends, `packages/` contains shared UI and lint/TypeScript configurations, `services/` contains the independent backends, and `infra/` contains Terraform. Development defaults are 3000 (Contoso Web), 3001 (Blog), 3002 (Support), and 5100 (RigidPort).

### Available Scripts

Root `pnpm dev`, `pnpm build`, and `pnpm lint` run Turborepo tasks across the workspace. Use workspace-filtered commands for rehearsal and tests; there is no root `pnpm test` script.

## What's Been Hardened

These pull requests document earlier engineering work. They are historical references, not a new security audit or current readiness assessment.

| PR                                                                         | Theme                                                                  | Closes           | Milestone                |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------- | ------------------------ |
| [#283](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/283) | Repo hygiene - remove accidental artifacts and stale README references | (housekeeping)   | -                        |
| [#285](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/285) | Fix broken root tooling and missing UI package exports                 | #225, #226, #235 | P0 Security Baseline     |
| [#288](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/288) | Fix XSS in blog Markdown rendering and sanitize support-app issue body | #220, #224       | P0 Security Baseline     |
| [#289](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/289) | Add JWT auth to medical-api and bearer auth to platform-api            | #221, #222       | P0 Security Baseline     |
| [#290](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/290) | Add rate limiting to all four services                                 | #223             | P0 Security Baseline     |
| [#291](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/291) | Fix CI security gates and add support-app workflow                     | #233, #234       | P1 CI & Testing Baseline |
| [#292](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/292) | Add backend service tests (medical-api, platform-api, ai-tool-digest)  | #228, #229, #232 | P1 CI & Testing Baseline |
| [#293](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/293) | Add frontend Jest tests (UI package, support-app, contoso-web-app)     | #227, #230, #231 | P1 CI & Testing Baseline |

### Highlights

Recorded changes included `marked` + `isomorphic-dompurify` in the blog renderer, `jose` HS256 JWTs instead of spoofable medical-api identity headers, platform-api bearer middleware, service rate limits, and removal of silent `continueOnError` in Azure Pipeline security scanning.

### P2 / P3 Backlog Sweep (latest wave)

This was the recorded follow-up wave; it is not a current backlog count.

| PR                                                                         | Theme                                                                      | Closes   |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| [#344](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/344) | Fix duplicated minimal-API block in `rigidport/Program.cs` (CodeQL CS8803) | (hotfix) |
| [#345](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/345) | PIPA BC research de-identification in `medical-api`                        | #259     |
| [#346](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/346) | Production Dockerfile for `medical-api`                                    | #250     |
| [#347](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/347) | Production Dockerfile for `platform-api`                                   | #251     |
| [#348](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/348) | Security alerting in `medical-api` audit middleware                        | #258     |
| [#349](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/349) | Zod input validation + `/users` pagination in `platform-api`               | #253     |
| [#350](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/350) | Structured logging with `pino` in `platform-api`                           | #264     |
| [#351](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/351) | Cookie auth + `X-API-Key` middleware for `rigidport`                       | #254     |
| [#352](https://github.com/VeVarunSharma/contoso-vibe-engineering/pull/352) | Workspace-wide Zod 3 to 4 migration                                        | #208     |

Follow-up implementation notes recorded non-root multi-stage Docker images with `pnpm deploy --prod` for medical-api/platform-api; pino redaction and request-scoped logging; optional `ALERT_WEBHOOK_URL` security alerts (or stderr); and research de-identification that removes direct identifiers and generalizes birth dates to years and postal codes to FSAs. The RigidPort work recorded cookie/API-key authentication and 48 passing xUnit tests using `TestAuthHandler` at that time. Zod 4 conventions use `ZodError.issues`, top-level email/URL validators, and `.extend()` rather than `.merge()`.

</details>

## Contributing

Use the repository instructions and the relevant workspace's tests. For this journey:

```powershell
pnpm --filter octocat-support-app test:ci
pnpm --filter octocat-support-app lint
pnpm --filter octocat-support-app typecheck
pnpm --filter octocat-support-app build
```

## License

MIT
