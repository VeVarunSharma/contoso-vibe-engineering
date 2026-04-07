---
mode: agent
description: "Generate a new API endpoint with proper validation, error handling, and tests"
---

# Scaffold API Endpoint

Help me scaffold a new API endpoint for this monorepo. I need:

1. **Route Handler** — Create the Express.js route with proper HTTP method handling
2. **Zod Validation** — Add request body/query parameter validation schemas
3. **Drizzle Query** — Write the database query using Drizzle ORM
4. **Error Handling** — Include proper try/catch with typed error responses
5. **Tests** — Generate Jest test file with mocked database calls

Follow the existing patterns in `services/` for file structure and naming conventions.

Ask me for:
- The service name (which service in `services/`)
- The endpoint path and HTTP method
- The request/response shape
- The database table(s) involved
