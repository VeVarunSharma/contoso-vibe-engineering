import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  rootDir: "src",
  extensionsToTreatAsEsm: [".ts"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: "./tsconfig.json",
    },
  },
};

export default config;
