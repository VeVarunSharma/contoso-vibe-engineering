module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "@swc/jest",
      { jsc: { parser: { syntax: "typescript" }, target: "es2022" } },
    ],
  },
  moduleNameMapper: {
    "^@test-mocks/(.*)$": "<rootDir>/config/jest/__mocks__/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  clearMocks: true,
  restoreMocks: true,
};
