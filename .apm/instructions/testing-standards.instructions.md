---
applyTo: "**/*.test.{ts,tsx,js,jsx}"
---

# Testing Standards

Follow these testing conventions across the monorepo:

## Framework
- Use **Jest** with `@swc/jest` for fast TypeScript transformation
- Use **React Testing Library** for component tests
- Import shared mocks using the `@test-mocks/` alias

## Test Structure
- Co-locate tests with source code in `__tests__/` folders
- Name test files to match source: `Button.tsx` → `__tests__/Button.test.tsx`
- Use descriptive `describe` and `it` blocks that read like specifications

## Assertions
- Prefer `toBeInTheDocument()` for DOM presence checks
- Use `userEvent` over `fireEvent` for realistic user interactions
- Assert on accessible roles and labels, not implementation details

## Mocking
- Mock database connections in service tests
- Mock `fetch` calls with typed response data
- Reset all mocks between tests using `afterEach`
