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

## References

- [PIPA BC Full Text](https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/03063_01)
- [OIPC BC Guidance](https://www.oipc.bc.ca/)
- [PIPA BC Guide for Businesses](https://www.oipc.bc.ca/guidance-documents/1438)

## CI/CD Compliance Gates

This API is designed to demonstrate automated compliance checking in CI pipelines:

### GitHub Copilot CLI Integration

```yaml
# Example workflow step
- name: Check PIPA Compliance
  run: |
    gh copilot suggest "Review this code for PIPA BC compliance issues" \
      --type shell < services/medical-api/src/routes/patients.ts
```

### Compliance Checklist for PR Reviews

- [ ] Consent verified before all PHI access
- [ ] Purpose parameter required on data endpoints
- [ ] Data minimization applied via `filterPHI()`
- [ ] Role-based access enforced
- [ ] Audit logs contain no PHI values
- [ ] Consent withdrawal properly implemented
