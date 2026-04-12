---
mode: agent
description: "Review code for security vulnerabilities, dependency risks, and hardening opportunities"
---

# Security Audit

Perform a comprehensive security audit on the current codebase. Check for:

1. **Input Validation** — Are all user inputs validated with Zod schemas before processing?
2. **SQL Injection** — Are all database queries using Drizzle ORM parameterized queries?
3. **XSS Prevention** — Is user-generated content properly sanitized before rendering?
4. **Secret Exposure** — Are API keys, tokens, or credentials hardcoded anywhere in the code?
5. **Dependency Vulnerabilities** — Are there known CVEs in the project's dependencies?
6. **Authentication** — Are auth tokens properly validated and scoped?
7. **Error Handling** — Do error responses avoid leaking stack traces or internal details?

Provide a prioritized list of findings with severity (Critical/High/Medium/Low) and specific remediation steps.
