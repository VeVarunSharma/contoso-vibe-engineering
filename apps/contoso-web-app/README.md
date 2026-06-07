# Contoso Web App

> The flagship **Vibe Engineering** demo. Two routes show the same feature side-by-side: a "legacy vibe" (vibe-coded, vulnerable) implementation and a "secure vibe" (vibe-engineered, hardened) one.

This app is intentionally small — its job is to make the security, validation, and design-system contrast visible at a glance, not to be a real product.

## What's inside

| Route | What it shows |
| ----- | ------------- |
| [`/legacy-vibe`](app/legacy-vibe/page.tsx) | Hardcoded markup, inline styles, raw SQL string concatenation, no input validation. Calls `/api/legacy-vibe`. |
| [`/secure-vibe`](app/secure-vibe/page.tsx) | `@workspace/ui` components, Zod-validated inputs, safe DTOs. Calls `/api/secure-vibe`. |
| [`/api/legacy-vibe`](app/api/legacy-vibe/route.ts) | Demonstrates SQL injection, returns sensitive fields. |
| [`/api/secure-vibe`](app/api/secure-vibe/route.ts) | Parameterized queries via Drizzle, Zod-validated body, returns only safe fields. |

The `/api/secure-vibe` route also has its markdown rendering sanitized (see PR #288).

## Tech stack

- **Next.js 15** (App Router, Server Components)
- **React 19**, **Tailwind CSS 4**
- **TypeScript** in strict mode
- **`@workspace/ui`** for shared design tokens & components

## Run it locally

From the monorepo root:

```bash
pnpm install
pnpm --filter contoso-web-app dev
```

The app starts on **http://localhost:3000**. No environment variables are required — the demo data is hardcoded.

## Tests

```bash
pnpm --filter contoso-web-app test
pnpm --filter contoso-web-app test:e2e   # Playwright
```

## Build

```bash
pnpm --filter contoso-web-app build
```

## See also

- [`packages/ui`](../../packages/ui/README.md) — shared design system
- [Root README](../../README.md) — monorepo overview & repo philosophy
