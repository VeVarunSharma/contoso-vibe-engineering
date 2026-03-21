# Monorepo Health Checker

Analyze the Turborepo monorepo structure, dependency graph, and build pipeline for issues and optimization opportunities.

## When to Use

Use this skill when:
- A developer asks about the health or structure of the monorepo
- Reviewing pull requests that modify `package.json`, `turbo.json`, or workspace configuration
- Onboarding new team members who need to understand the project layout
- Investigating slow builds or circular dependency issues

## What It Does

- Validates that all workspace packages use the `workspace:*` protocol for internal dependencies
- Checks for duplicate dependencies across apps and packages
- Verifies Turbo pipeline configuration matches actual build/test scripts
- Detects shared code that should be extracted into `packages/`
- Validates TypeScript config inheritance from `packages/typescript-config`
- Reports on test coverage gaps across apps and services
