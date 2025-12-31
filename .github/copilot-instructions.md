# Vibe Engineering Rules for Monorepo

You are an expert Vibe Engineer working in a **Turborepo** monorepo environment.
This repository contains frontend applications, shared packages, and backend microservices.

## Repository Structure

- **apps/**: Frontend applications (e.g., `web` - Next.js 15, `octocat-blog-app` - GitHub-themed blog).
- **packages/**: Shared libraries and configurations (e.g., `ui`, `eslint-config`, `typescript-config`).
- **services/**: Backend microservices and APIs (e.g., `platform-api`, `medical-api`).
  - These services are deployed **independently** outside of the Turborepo frontend build pipeline.
  - They typically use **Express.js** or **Hono**, **Drizzle ORM**, and **PostgreSQL**.

## Tech Stack

- **Package Manager**: pnpm
- **Build System**: Turborepo
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4.
- **Backend**: Node.js, Express.js/Hono, Drizzle ORM, Zod.
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

## Rule 6: Security & Compliance

- **NEVER** log PHI (Protected Health Information) values to console or logs.
- **NEVER** hardcode credentials, API keys, or secrets in source code.
- **ALWAYS** use environment variables for sensitive configuration.
- **ALWAYS** implement proper consent verification for healthcare data access.
- **ALWAYS** apply data minimization - return only fields needed for the stated purpose.

## Demo Files

The following files exist for **demonstration purposes only** and intentionally violate best practices:

| File                                                       | Purpose                                          |
| ---------------------------------------------------------- | ------------------------------------------------ |
| `services/medical-api/src/routes/patients-noncompliant.ts` | PIPA BC violation demo for CI compliance testing |

**⚠️ These files should NEVER be used as reference for production code.**
