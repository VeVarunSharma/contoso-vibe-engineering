# `@workspace/typescript-config`

> Shared `tsconfig` presets for the Vibe Engineering monorepo. Three drop-in configs covering Node services, Next.js apps, and shared React libraries — all opinionated for strict mode + modern module resolution.

## What's exported

| File | `display` name | When to use |
| ---- | -------------- | ----------- |
| [`base.json`](base.json) | `Default` | Plain Node / TypeScript services (`services/platform-api`, `services/medical-api`, etc.) |
| [`nextjs.json`](nextjs.json) | `Next.js` | Next.js apps (`apps/contoso-web-app`, `apps/octocat-*`). Extends `base.json` and adds the Next.js plugin, `module: ESNext`, `moduleResolution: Bundler`, `noEmit`, JSX preserve, `allowJs`. |
| [`react-library.json`](react-library.json) | `React Library` | Shared React component libraries (`packages/ui`). Extends `base.json` with JSX + React-friendly defaults. |

## Common compiler options (set in `base.json`)

- `strict: true` (all strict checks on)
- `noUncheckedIndexedAccess: true` (array/record access returns `T | undefined`)
- `isolatedModules: true` (every file must be independently transpilable)
- `module: NodeNext` / `moduleResolution: NodeNext`
- `target: ES2022`, `lib: [es2022, DOM, DOM.Iterable]`
- `declaration: true`, `declarationMap: true`
- `esModuleInterop: true`, `resolveJsonModule: true`
- `skipLibCheck: true`

## Usage

Reference the config you need from your per-package `tsconfig.json`:

```json
// services/platform-api/tsconfig.json
{
  "extends": "@workspace/typescript-config/base.json",
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

```json
// apps/contoso-web-app/tsconfig.json
{
  "extends": "@workspace/typescript-config/nextjs.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

```json
// packages/ui/tsconfig.json
{
  "extends": "@workspace/typescript-config/react-library.json",
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Extending

Override compiler options in the consuming `tsconfig.json` as needed — the shared base is intentionally strict so each package can relax options locally rather than fight a permissive default.

## See also

- [`packages/eslint-config`](../eslint-config/README.md) — companion shared ESLint presets
- [Root README](../../README.md) — monorepo overview

