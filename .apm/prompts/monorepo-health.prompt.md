---
mode: agent
description: "Analyze the monorepo structure and suggest improvements for build performance and dependency management"
---

# Monorepo Health Check

Analyze this Turborepo monorepo and provide a health report covering:

1. **Dependency Graph** — Are workspace dependencies properly declared with `workspace:*`?
2. **Build Pipeline** — Is the Turbo pipeline configuration optimal? Are there missing or unnecessary task dependencies?
3. **Shared Packages** — Are there components or utilities duplicated across apps that should be in `packages/`?
4. **Bundle Size** — Are there unnecessarily large dependencies or unused imports?
5. **TypeScript Config** — Do `tsconfig.json` files properly extend the shared config from `packages/typescript-config`?
6. **Test Coverage** — Are there apps or services missing test configurations?

Provide specific recommendations with file paths and suggested changes.
