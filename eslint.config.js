import { config } from "@workspace/eslint-config/base";

/**
 * Root ESLint configuration.
 *
 * Per-workspace lint rules live in each package/app's own `eslint.config.js`
 * (e.g. `next-js` for the apps, `react-internal` for `packages/ui`). This
 * root config exists so that `eslint .` from the repo root has a sensible
 * default for any loose script files at the root, and so editors can
 * resolve a config when files outside a workspace are opened.
 *
 * @type {import("eslint").Linter.Config}
 */
export default [
  ...config,
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "apps/**",
      "packages/**",
      "services/**",
    ],
  },
];
