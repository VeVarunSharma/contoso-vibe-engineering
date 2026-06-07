# `@workspace/eslint-config`

> Shared ESLint 9 (flat config) presets for the Vibe Engineering monorepo. Three drop-in configs: one for plain Node services, one for Next.js apps, and one for shared React libraries.

## What's exported

| File | When to use | Plugins enabled |
| ---- | ----------- | --------------- |
| [`base.js`](base.js) | Plain Node / TypeScript libraries (`services/*`, `packages/eslint-config`, etc.) | `@typescript-eslint`, `eslint-plugin-turbo`, `eslint-plugin-only-warn` |
| [`next.js`](next.js) | Next.js apps (`apps/contoso-web-app`, `apps/octocat-*`) | base + `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next` |
| [`react-internal.js`](react-internal.js) | Shared React libraries (`packages/ui`) | base + react + react-hooks (no Next.js plugin) |

## Usage

Pull the config you need into a per-package `eslint.config.js`:

```js
// apps/contoso-web-app/eslint.config.js
import { nextJsConfig } from "@workspace/eslint-config/next-js";

export default nextJsConfig;
```

```js
// services/platform-api/eslint.config.js
import { config } from "@workspace/eslint-config/base";

export default config;
```

```js
// packages/ui/eslint.config.js
import { config } from "@workspace/eslint-config/react-internal";

export default config;
```

## Extending

The exported arrays follow ESLint's flat-config convention, so you can spread + extend in the consumer:

```js
import { config as baseConfig } from "@workspace/eslint-config/base";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];
```

## See also

- [`packages/typescript-config`](../typescript-config/README.md) — companion shared `tsconfig` presets
- [Root README](../../README.md) — monorepo overview

