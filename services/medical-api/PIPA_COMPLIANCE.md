# PIPA BC Compliance Documentation

> This document details how the Medical API implements British Columbia's Personal Information Protection Act (PIPA) requirements.

## What is PIPA BC?

The **Personal Information Protection Act (PIPA)** is British Columbia's private sector privacy legislation. It governs how organizations collect, use, and disclose personal information in the course of commercial activities.

For healthcare applications handling patient data (Protected Health Information - PHI), PIPA BC compliance is critical.

## Database Design for Compliance

This API uses **PostgreSQL** with **Drizzle ORM** for type-safe, auditable data access.

### Schema Highlights

```sql
-- UUIDs prevent enumeration attacks
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- Consent is tracked separately for auditability
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  purpose TEXT NOT NULL,
  granted_at TIMESTAMP DEFAULT now(),
  withdrawn_at TIMESTAMP,  -- Soft delete for audit trail
  is_active BOOLEAN DEFAULT true
);

-- Audit logs NEVER contain PHI values
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fields_accessed JSONB,  -- Field names only, not values
  ...
);
```

## Key PIPA BC Requirements Implemented in This API

### 1. Consent Verification (Section 6)

**Requirement:** Organizations must obtain consent before collecting, using, or disclosing personal information.

**Implementation:** See [consent.ts](src/middleware/consent.ts)

```typescript
// Before any data access, verify consent exists
const consentResult = await verifyConsent(patientId, purpose, user.id);
if (!consentResult.valid) {
  await createAuditLog({ action: "ACCESS_DENIED", ... });
  return c.json({ error: "Consent verification failed" }, 403);
}
```

### 2. Purpose Limitation (Section 11)

**Requirement:** Personal information can only be used for the purpose for which it was collected.

**Implementation:**

- API requires explicit `purpose` parameter on all data access requests
- Each purpose has specific field access rules
- Role-based restrictions layer on top of purpose

### 3. Data Minimization (Section 4)

**Requirement:** Collect only the minimum amount of personal information necessary.

**Implementation:** See [pii-filter.ts](src/utils/pii-filter.ts)

```typescript
// filterPHI returns only fields needed for the stated purpose
const filteredData = filterPHI(patient, purpose, user.role);
```

### 4. Access Controls (Section 34)

**Requirement:** Organizations must protect personal information with appropriate security.

**Implementation:** See [auth.ts](src/middleware/auth.ts)

- Authentication required for all endpoints (`requireAuth`)
- Role-based access control (`requireRole`)
- Purpose-based field restrictions

### 5. Audit Trail (Section 34)

**Requirement:** Organizations must be able to demonstrate compliance.

**Implementation:** See [audit.ts](src/middleware/audit.ts)

```typescript
// Log all access without storing PHI values
await createAuditLog({
  action: "PATIENT_ACCESS",
  resourceType: "patient",
  resourceId: patientId, // ID only, not the data
  fieldsAccessed: ["firstName", "lastName"], // Field names only
  // NEVER log: actual values, SIN, PHN, medical records
});
```

### 6. Withdrawal of Consent (Section 9)

**Requirement:** Individuals can withdraw consent at any time.

**Implementation:**

- `DELETE /patients/:id/consent/:consentId` endpoint
- Consent records track `withdrawnAt` timestamp
- Subsequent access checks fail for withdrawn consent

### 7. Emergency Access (Section 18)

**Requirement:** Disclosure without consent is permitted in emergencies.

**Implementation:**

```typescript
if (purpose === "emergency") {
  return {
    valid: true,
    reason: "Emergency access permitted under PIPA BC Section 18",
  };
}
```

## Compliant Patterns ✅

### DO: Verify consent before data access

```typescript
const consent = await verifyConsent(patientId, purpose, userId);
if (!consent.valid) {
  await logAccessDenied(...);
  return forbidden();
}
```

### DO: Apply data minimization

```typescript
const filtered = filterPHI(patient, purpose, role);
return { data: filtered };
```

### DO: Log access without PHI

```typescript
await createAuditLog({
  fieldsAccessed: ["firstName", "medicalHistory"], // Names only
  // NOT: fieldsAccessed: [{ firstName: "John", medicalHistory: [...] }]
});
```

### DO: Check role permissions

```typescript
if (!ROLE_PERMISSIONS[user.role].includes(purpose)) {
  return forbidden();
}
```

## Anti-Patterns to Avoid ❌

### DON'T: Return all patient data without filtering

```typescript
// BAD - Returns everything regardless of purpose
app.get("/patients/:id", async (c) => {
  const patient = await db.query.patients.findFirst(...);
  return c.json(patient);  // Includes SIN, PHN, full medical history
});
```

### DON'T: Skip consent verification

```typescript
// BAD - No consent check
app.get("/patients/:id", async (c) => {
  const patient = await db.query.patients.findFirst(...);
  return c.json(patient);
});
```

### DON'T: Log actual PHI values

```typescript
// BAD - Logs sensitive data
await createAuditLog({
  fieldsAccessed: JSON.stringify(patient), // Contains SIN, PHN, etc.
});
```

### DON'T: Ignore role-based access

```typescript
// BAD - Any authenticated user can access anything
app.get("/patients/:id", requireAuth, async (c) => {
  // No role check
  const patient = await db.query.patients.findFirst(...);
  return c.json(patient);
});
```

### DON'T: Hardcode credentials

```typescript
// BAD - Credentials in source code
const API_KEY = "sk-prod-12345-secret";
const DB_PASSWORD = "super_secret_password";
```

### DON'T: Create bulk export endpoints without controls

```typescript
// BAD - No auth, no consent, no filtering
app.get("/patients/export/all", async (c) => {
  const allPatients = await db.query.patients.findMany();
  return c.json(allPatients);
});
```

### DON'T: Log PHI values to console

```typescript
// BAD - Logs sensitive patient data
console.log(`Patient: ${patient.firstName} ${patient.lastName}`);
console.log(`SIN: ${patient.socialInsuranceNumber}`);
console.log(`PHN: ${patient.healthCardNumber}`);
```

## Non-Compliant Demo File

For demonstration purposes, this API includes a file that intentionally violates PIPA BC:

**File:** [`src/routes/patients-noncompliant.ts`](src/routes/patients-noncompliant.ts)

**Purpose:** To test the GitHub Copilot CLI compliance agent in CI/CD pipelines.

**Violations Included:**

| #   | Violation                                 | PIPA Section |
| --- | ----------------------------------------- | ------------ |
| 1   | No authentication middleware              | Section 34   |
| 2   | No consent verification                   | Section 6    |
| 3   | No data minimization (returns ALL fields) | Section 4    |
| 4   | PHI values logged to console              | Section 34   |
| 5   | Bulk export without access controls       | Section 34   |
| 6   | No audit logging                          | Section 34   |
| 7   | No purpose validation                     | Section 11   |
| 8   | Hardcoded credentials in source           | Section 34   |

**⚠️ WARNING:** This file should NEVER be used in production. It exists solely to demonstrate what the CI compliance gates should catch.

### Testing with Non-Compliant Code

To test that the CI gate properly catches violations:

1. Uncomment the non-compliant route in `src/index.ts`:

   ```typescript
   import patientsNoncompliantRouter from "./routes/patients-noncompliant.js";
   app.route("/api/patients-unsafe", patientsNoncompliantRouter);
   ```

2. Push the changes to a PR branch

3. The PIPA BC compliance workflow should:
   - Detect all 8 violation types
   - Generate a compliance score well below 80
   - Mark the PR check as **FAILED**
   - List all violations in the workflow summary

## References

- [PIPA BC Full Text](https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/03063_01)
- [OIPC BC Guidance](https://www.oipc.bc.ca/)
- [PIPA BC Guide for Businesses](https://www.oipc.bc.ca/guidance-documents/1438)

## CI/CD Compliance Gates

This API includes automated PIPA BC compliance checking in the CI pipeline using GitHub Copilot CLI.

### GitHub Actions Workflow

The compliance workflow is defined at [`.github/workflows/pipa-bc-compliance.yml`](../../.github/workflows/pipa-bc-compliance.yml).

**Triggers:**

- Pull requests modifying `services/medical-api/**`
- Manual dispatch for testing

**What it does:**

1. Detects changed TypeScript/JavaScript files in the medical-api
2. Loads the PIPA BC compliance agent from `.github/agents/pipa-bc-compliance.agent.md`
3. Analyzes code against all PIPA BC sections
4. Generates a compliance report with score and violations
5. Posts the report as a PR comment
6. Fails the check if compliance score < 80% or critical violations found

### Workflow Configuration

```yaml
name: PIPA BC Compliance Check

on:
  pull_request:
    paths:
      - "services/medical-api/**"

env:
  COMPLIANCE_THRESHOLD: 80 # Minimum passing score
```

### Setup Instructions

1. Navigate to **Settings > Secrets and variables > Actions**
2. Create a repository secret named `COPILOT_GITHUB_TOKEN`
3. Use a fine-grained Personal Access Token with:
   - **Copilot Requests** read-only permission
4. Ensure the token owner has an active GitHub Copilot license

### Compliance Score Breakdown

| PIPA Section | Requirement            | Max Score |
| ------------ | ---------------------- | --------- |
| Section 6    | Consent Verification   | 15        |
| Section 4    | Data Minimization      | 15        |
| Section 11   | Purpose Limitation     | 15        |
| Section 34   | Security Safeguards    | 20        |
| Section 34   | Audit Logging (no PHI) | 20        |
| Section 9    | Consent Withdrawal     | 5         |
| Section 18   | Emergency Access       | 10        |
| **Total**    |                        | **100**   |

### Severity Levels

**CRITICAL** (Immediate Fail):

- PHI values in logs
- No authentication on PHI endpoints
- No consent verification
- Raw data exposure

**MAJOR**:

- Missing purpose validation
- Incomplete role-based access
- Missing audit logs

**MINOR**:

- Missing comments
- Documentation gaps

### Pass/Fail Criteria

| Score        | Status       | Outcome                 |
| ------------ | ------------ | ----------------------- |
| ≥ 80         | PASS         | ✅ PR check passes      |
| 60-79        | NEEDS_REVIEW | ⚠️ May pass with review |
| < 60         | FAIL         | ❌ PR check fails       |
| Any critical | FAIL         | ❌ PR check fails       |

### Compliance Checklist for PR Reviews

- [ ] Consent verified before all PHI access (`verifyConsent()`)
- [ ] Purpose parameter required on data endpoints
- [ ] Data minimization applied via `filterPHI()`
- [ ] Role-based access enforced (`ROLE_PERMISSIONS`)
- [ ] Audit logs contain no PHI values (field names only)
- [ ] Consent withdrawal properly implemented
- [ ] Emergency access logged appropriately
- [ ] No hardcoded credentials or API keys
- [ ] No console.log() statements with PHI values

### Testing the Workflow Locally

```bash
# Install GitHub Copilot CLI
npm i -g @github/copilot

# Run compliance check manually
copilot --prompt "$(cat .github/agents/pipa-bc-compliance.agent.md)" \
  --allow-all-tools --allow-all-paths
```
