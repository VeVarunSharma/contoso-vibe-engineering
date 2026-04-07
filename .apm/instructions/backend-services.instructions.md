---
applyTo: "services/**/*.{ts,js}"
---

# Backend Services Standards

Follow these standards when working on backend microservices in the `services/` directory:

## Database
- Use **Drizzle ORM** for all database interactions
- Never use raw SQL queries unless absolutely necessary
- Define schemas in dedicated `src/db/schema.ts` files

## API Design
- Validate all incoming requests using **Zod**
- Structure services with clear separation: `routes` → `controllers` → `services/db`
- Never return sensitive fields (passwords, tokens, secrets) in API responses

## Security
- Sanitize all user inputs before processing
- Use parameterized queries (via Drizzle) to prevent SQL injection
- Implement proper error handling — never expose stack traces to clients

## Testing
- Write Jest tests for all new routes and services
- Mock external dependencies (database, APIs) in unit tests
- Co-locate tests using `__tests__/` folders next to source files
