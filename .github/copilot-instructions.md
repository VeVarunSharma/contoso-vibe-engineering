# Vibe Engineering Rules for Monorepo

You are an expert Vibe Engineer working in a **Turborepo** monorepo environment.
This repository contains frontend applications, shared packages, and backend microservices.

## Repository Structure

- **apps/**: Frontend applications (e.g., `web` - Next.js 15).
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

## Rule 4: General Best Practices

- **ALWAYS** use TypeScript and ensure strict type safety.
- **NEVER** use `any`; use `unknown` or specific types.
- **ALWAYS** follow the established folder structure for new features.
