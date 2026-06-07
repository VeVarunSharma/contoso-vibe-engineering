/** @type {import('jest').Config} */
module.exports = {
  rootDir: ".",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", tsx: true, decorators: false },
          transform: { react: { runtime: "automatic" } },
        },
      },
    ],
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sss|styl)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/$1",
    "^@workspace/ui/components/(.*)$":
      "<rootDir>/../../packages/ui/src/components/$1",
    "^@workspace/ui/lib/(.*)$": "<rootDir>/../../packages/ui/src/lib/$1",
    "^@workspace/ui/hooks/(.*)$": "<rootDir>/../../packages/ui/src/hooks/$1",
    "^@workspace/ui$": "<rootDir>/../../packages/ui/src/index.ts",
    "^lucide-react$":
      "<rootDir>/node_modules/lucide-react/dist/cjs/lucide-react.js",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};
