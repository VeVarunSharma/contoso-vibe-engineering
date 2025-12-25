const esmModules = ["uuid"];

module.exports = {
  rootDir: "../../",
  setupFiles: ["<rootDir>/config/jest/env.setup.js"],
  setupFilesAfterEnv: ["<rootDir>/config/jest/jest.setup.js"],
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
    "^.+\\.svg$": "<rootDir>/config/jest/svgTransform.js",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sss|styl)$": "<rootDir>/node_modules/identity-obj-proxy",
    "^@components(.*)$": "<rootDir>/components$1",
    "^@/(.*)$": "<rootDir>/$1",
    "^@test-mocks/(.*)$": "<rootDir>/config/jest/__mocks__/$1",
    "^lucide-react$":
      "<rootDir>/node_modules/lucide-react/dist/cjs/lucide-react.js",
  },
  verbose: true,
  collectCoverage: true,
  coveragePathIgnorePatterns: ["<rootDir>/test/test-utils.js"],
  testPathIgnorePatterns: ["<rootDir>/e2e/", "<rootDir>/e2e/"],
  // ignore cypress
  modulePathIgnorePatterns: ["./cypress"],
  transformIgnorePatterns: [
    `node_modules/(?!(?:.pnpm/)?(${esmModules.join("|")})(?:@|/))`,
  ],
  testEnvironment: "jsdom",
};
