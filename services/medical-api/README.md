# Medical API Service

> A PIPA BC compliant medical patient API service demonstrating privacy-first healthcare data handling.

This service is designed for a blog article demonstrating how to use **GitHub Copilot CLI in GitHub Actions** for non-deterministic CI compliance gates.

## Overview

This API implements British Columbia's Personal Information Protection Act (PIPA) requirements for handling Protected Health Information (PHI). It demonstrates both compliant and anti-pattern implementations for educational purposes.

## Tech Stack

| Technology                                    | Version | Purpose                      |
| --------------------------------------------- | ------- | ---------------------------- |
| [Hono](https://hono.dev/)                     | 4.4.x   | Lightweight HTTP framework   |
| [Drizzle ORM](https://orm.drizzle.team/)      | 0.45.x  | Type-safe PostgreSQL ORM     |
| [PostgreSQL](https://www.postgresql.org/)     | 15+     | Database (via node-postgres) |
| [Zod](https://zod.dev/)                       | 3.23.x  | Request validation           |
| [TypeScript](https://www.typescriptlang.org/) | 5.5.x   | Type safety                  |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (local or remote)

### Installation

```bash
# From monorepo root
pnpm install

# Or from this directory
cd services/medical-api
pnpm install
```

### Environment Setup

Create a `.env` file:

```bash
# PostgreSQL connection string (required)
DATABASE_URL="postgresql://user:password@localhost:5432/medical_db"

# Server port (optional, defaults to 3000)
PORT=3000
```

### Database Setup

```bash
# Generate migrations from schema
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Seed sample data (optional)
pnpm db:seed
```

### Running the Server

```bash
# Development (with hot reload)
pnpm dev

# Production
pnpm build
pnpm start
```

## API Endpoints

### Authentication

All endpoints require a `Authorization: Bearer <token>` header. For demo purposes, tokens are mock JWTs containing:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "physician|nurse|admin|billing"
}
```

### Patient Endpoints

| Method | Endpoint                           | Description                           | Required Role     |
| ------ | ---------------------------------- | ------------------------------------- | ----------------- |
| GET    | `/patients/:id`                    | Get patient with purpose-filtered PHI | physician, nurse  |
| GET    | `/patients/:id/summary`            | Get minimal patient summary           | All authenticated |
| POST   | `/patients/:id/consent`            | Grant consent for a purpose           | admin             |
| DELETE | `/patients/:id/consent/:consentId` | Withdraw consent                      | admin             |

### Query Parameters

| Parameter | Type   | Required | Description                                                 |
| --------- | ------ | -------- | ----------------------------------------------------------- |
| `purpose` | string | Yes      | Reason for access (treatment, billing, emergency, research) |

### Example Request

```bash
curl -X GET "http://localhost:3000/patients/123?purpose=treatment" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Example Response (Filtered by Purpose)

```json
{
  "data": {
    "id": "patient-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1985-03-15",
    "medicalHistory": [...],
    "medications": [...],
    "allergies": [...]
  },
  "consent": {
    "id": "consent-uuid",
    "purpose": "treatment",
    "grantedAt": "2024-01-15T10:00:00Z"
  },
  "audit": {
    "id": "audit-uuid",
    "timestamp": "2024-12-31T12:00:00Z"
  }
}
```

> **Note:** Financial fields (insuranceInfo) are excluded for `treatment` purpose. SIN/PHN are only included for `billing` purpose with proper role.

## PIPA BC Compliance Features

See [PIPA_COMPLIANCE.md](./PIPA_COMPLIANCE.md) for detailed compliance documentation.

### Key Implementations

| PIPA Section | Requirement        | Implementation                                            |
| ------------ | ------------------ | --------------------------------------------------------- |
| Section 6    | Consent            | `src/middleware/consent.ts` - Verify before access        |
| Section 11   | Purpose Limitation | `purpose` param required on all requests                  |
| Section 4    | Data Minimization  | `src/utils/pii-filter.ts` - Return only needed fields     |
| Section 34   | Security           | `src/middleware/auth.ts` - Role-based access control      |
| Section 34   | Audit Trail        | `src/middleware/audit.ts` - Log access without PHI values |
| Section 9    | Consent Withdrawal | DELETE consent endpoint                                   |
| Section 18   | Emergency Access   | Bypass consent for emergencies                            |

## Project Structure

```
services/medical-api/
├── drizzle/                    # Generated SQL migrations
├── src/
│   ├── db/
│   │   ├── index.ts           # Database connection (PostgreSQL Pool)
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   ├── migrate.ts         # Migration runner
│   │   └── seed.ts            # Sample data seeder
│   ├── middleware/
│   │   ├── auth.ts            # JWT auth & role verification
│   │   ├── consent.ts         # PIPA consent verification
│   │   └── audit.ts           # Audit logging (no PHI values)
│   ├── routes/
│   │   └── patients.ts        # Patient CRUD endpoints
│   ├── utils/
│   │   └── pii-filter.ts      # Data minimization helper
│   └── index.ts               # Hono server entry point
├── drizzle.config.ts          # Drizzle Kit configuration
├── package.json
├── tsconfig.json
├── PIPA_COMPLIANCE.md         # Compliance documentation
└── README.md                  # This file
```

## Database Schema

### Tables

| Table             | Purpose                                       |
| ----------------- | --------------------------------------------- |
| `patients`        | Patient demographics & medical records        |
| `users`           | Healthcare staff (physicians, nurses, admins) |
| `consent_records` | Patient consent grants/withdrawals            |
| `audit_logs`      | Access audit trail (no PHI values stored)     |

### Key Design Decisions

1. **UUIDs for all IDs** - Prevents enumeration attacks
2. **JSONB for complex fields** - Flexible storage for medical data
3. **Soft delete for consent** - `withdrawn_at` instead of hard delete
4. **No PHI in audit logs** - Only field names, never values

## Scripts

| Script      | Command            | Description                       |
| ----------- | ------------------ | --------------------------------- |
| dev         | `pnpm dev`         | Start with hot reload (tsx watch) |
| build       | `pnpm build`       | Compile TypeScript                |
| start       | `pnpm start`       | Run compiled output               |
| db:generate | `pnpm db:generate` | Generate migrations from schema   |
| db:migrate  | `pnpm db:migrate`  | Apply migrations to database      |
| db:seed     | `pnpm db:seed`     | Insert sample data                |

## Demo Scenarios

This API is designed to demonstrate two scenarios for CI compliance gates:

### ✅ Compliant Version (This Branch)

- Consent verification before all data access
- Purpose-based data filtering
- Role-based access control
- Audit logging without PHI values
- Consent withdrawal support

### ❌ Non-Compliant Version (For Demo)

To create a non-compliant version for testing CI gates:

1. Remove consent checks from patient routes
2. Return full patient records without filtering
3. Log PHI values in audit trails
4. Skip role verification

The CI pipeline should **fail** on the non-compliant branch when GitHub Copilot CLI analyzes the code.

## Contributing

1. Follow the monorepo conventions in [copilot-instructions.md](../../.github/copilot-instructions.md)
2. Use Drizzle ORM for all database operations
3. Validate all inputs with Zod
4. Never log PHI values
5. Always verify consent before data access

## License

Internal use only - Contoso Vibe Engineering
