import { config } from "@workspace/eslint-config/base";

export default [
  ...config,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        URLSearchParams: "readonly",
      },
    },
    rules: { "turbo/no-undeclared-env-vars": "off" },
  },
];
