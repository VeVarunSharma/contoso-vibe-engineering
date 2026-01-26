# Vibe Engineering Rules for Monorepo

You are an expert Vibe Engineer working in a **Turborepo** monorepo environment.
This repository contains frontend applications, shared packages, and backend microservices.

## Repository Structure

- **apps/**: Frontend applications (e.g., `web` - Next.js 15, `octocat-blog-app` - GitHub-themed blog).
- **packages/**: Shared libraries and configurations (e.g., `ui`, `eslint-config`, `typescript-config`).
- **services/**: Backend microservices and APIs (e.g., `platform-api`).
  - These services are deployed **independently** outside of the Turborepo frontend build pipeline.
  - They typically use **Express.js**, **Drizzle ORM**, and **PostgreSQL**.

## Tech Stack

- **Package Manager**: pnpm
- **Build System**: Turborepo
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4.
- **Backend**: Node.js, Express.js, Drizzle ORM, Zod.
- **Database**: PostgreSQL.
- **Testing**: Jest, React Testing Library, @swc/jest.

## Rule 1: Architecture & Monorepo

- **ALWAYS** use the workspace protocol for internal dependencies (e.g., `"@workspace/ui": "workspace:*"`).
- **ALWAYS** import UI components from the shared package: `@workspace/ui` in frontend apps.
- **NEVER** create local copies of components that exist in the design system (`packages/ui`).
- **NEVER** hardcode Tailwind classes for standard elements; use the design system components.

## Rule 2: Backend & Services (`services/*`)

- **ALWAYS** use **Drizzle ORM** for database interactions.
- **NEVER** use raw SQL queries unless absolutely necessary; use `db.query` or query builders.
- **ALWAYS** validate incoming requests using **Zod**.
- **ALWAYS** structure services with clear separation of concerns: `routes` -> `controllers` (optional) -> `services/db`.
- **NEVER** return sensitive fields (passwords, tokens) in API responses.

## Rule 3: Frontend (`apps/*`)

- **ALWAYS** use **Server Components** by default in Next.js App Router.
- **ALWAYS** validate API route inputs using `zod` (if using Next.js API routes).
- **NEVER** trust `searchParams` or request bodies without parsing.

## Rule 4: Testing Best Practices

- **ALWAYS** write tests for new components and API routes.
- **ALWAYS** use Jest with `@swc/jest` for fast TypeScript transformation.
- **ALWAYS** mock external dependencies (database, APIs) in unit tests.
- **ALWAYS** use React Testing Library for component tests.
- **ALWAYS** co-locate tests with the code they test using `__tests__/` folders:
  - `components/__tests__/` - Component unit tests (next to components)
  - `app/api/[route]/__tests__/` - API route tests (next to route handlers)
  - `src/db/__tests__/` - Database schema tests (next to schema files)
  - `config/jest/__mocks__/` - Shared mock implementations
- **ALWAYS** import shared mocks using the `@test-mocks/` alias (e.g., `@test-mocks/db`).
- **ALWAYS** run `pnpm test` before submitting pull requests.
- **NEVER** commit code that breaks existing tests.

## Rule 5: General Best Practices

- **ALWAYS** use TypeScript and ensure strict type safety.
- **NEVER** use `any`; use `unknown` or specific types.
- **ALWAYS** follow the established folder structure for new features.

## WorkIQ Skill (Microsoft 365 Copilot)

Use the WorkIQ CLI/MCP server to pull live Microsoft 365 Copilot insights (meetings, emails, documents, Teams messages, people context, recommendations) whenever a request depends on current organizational knowledge.

### When to Trigger

- User asks about schedules, conflicts, focus blocks, or commute plans.
- User wants summaries of emails, Teams threads, action items, or stakeholder updates.
- Need thematic insights (e.g., "What should I prep for Contoso review?", "Summarize blockers from today").

### Setup & Access

1. **Copilot CLI plugin (preferred)**
   - `copilot`
   - `/plugin marketplace add github/copilot-plugins`
   - `/plugin install workiq@copilot-plugins`
   - Restart Copilot CLI.
2. **Standalone CLI / MCP server**
   - `npm install -g @microsoft/workiq` (or `npx -y @microsoft/workiq mcp`).
   - Accept EULA once: `workiq accept-eula`.
   - Use `workiq ask` for queries or `workiq mcp` to expose tools.
3. **Tenant consent** – First run requires Microsoft 365 admin consent; coordinate with tenant admins using the official enablement guide.

### Usage Flow

1. Confirm CLI availability (`Get-Command workiq`) and authentication status.
2. Clarify the intent/timeframe/topic before crafting the prompt.
3. Run `workiq ask --question "<precise prompt>"` (add `-t <tenant>` if needed).
4. Wait for completion (poll with `read_powershell` for long responses) and extract key insights: load, conflicts, tasks, recommendations.
5. Summarize in ≤3 sentences, referencing meetings/documents generically unless links are explicitly requested.
6. Offer WorkIQ-style follow-ups (block time, draft reschedules, request recordings, deeper queries).

### Common Commands

| Command                           | Purpose                                                          |
| --------------------------------- | ---------------------------------------------------------------- |
| `workiq --help`                   | Show global help/options.                                        |
| `workiq version`                  | Display installed version.                                       |
| `workiq accept-eula`              | Accept license (first use).                                      |
| `workiq ask --question "..."`     | Ask scoped question (agenda, docs, action items, Teams, people). |
| `workiq ask -t <tenant> -q "..."` | Target specific tenant.                                          |
| `workiq mcp`                      | Start MCP server for tool integration.                           |

### Best Practices

- Favor narrow prompts (per day/project/person) to minimize noise; combine multiple queries if needed.
- Record which WorkIQ prompts were used so future steps can reference them.
- Preserve confidentiality: describe events as "customer sync at 1 PM" rather than pasting links/attendees unless required.
- Surface WorkIQ's optional next steps (e.g., "WorkIQ can continue with Thu–Sun") and ask whether to proceed.
- Defer to `.github/skills/workiq-copilot/SKILL.md` for the full procedural guide and troubleshooting playbook.
