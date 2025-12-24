const esmModules = ["uuid"];

module.exports = {
  rootDir: "../../",
  setupFiles: ["<rootDir>/config/jest/env.setup.js"],
  setupFilesAfterEnv: ["<rootDir>/config/jest/jest.setup.js"],
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "@swc/jest",
    "^.+\\.svg$": "<rootDir>/config/jest/svgTransform.js",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sss|styl)$": "<rootDir>/node_modules/identity-obj-proxy",
    "^@components(.*)$": "<rootDir>/components$1",
    "^@/(.*)$": "<rootDir>/$1",
    "^lucide-react$":
      "<rootDir>/node_modules/lucide-react/dist/cjs/lucide-react.js",
  },
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coveragePathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/config/",
    "<rootDir>/__tests__/__mocks__/",
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  transformIgnorePatterns: [
    `node_modules/(?!(?:.pnpm/)?(${esmModules.join("|")})(?:@|/))`,
  ],
  testEnvironment: "jsdom",
};
