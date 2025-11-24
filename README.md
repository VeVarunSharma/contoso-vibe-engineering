# Vibe Engineering Demo (Monorepo Edition)

This project demonstrates the transition from "Single Player Vibe Coding" to "Multiplayer Vibe Engineering".

## The Problem: Legacy Vibe

Located in `apps/web/app/legacy-vibe`.

- **Architecture:** Ignores the shared `@workspace/ui` package. Hardcodes styles.
- **Security:** Vulnerable to SQL Injection. Returns sensitive user data (password hashes).
- **Validation:** None.

## The Solution: Vibe Engineering

Located in `apps/web/app/secure-vibe`.

- **Architecture:** Uses the shared `Button` from `@workspace/ui`.
- **Security:** Uses ORM methods (`findUnique`) and Zod validation.
- **Data:** Returns only safe DTOs.

## Configuration

The rules for the AI Agent are defined in `.github/copilot-instructions.md`.
