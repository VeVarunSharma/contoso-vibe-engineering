import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db/index.js";
import { patients, consentRecords } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  requireAuth,
  requireRole,
  ROLE_PERMISSIONS,
} from "../middleware/auth.js";
import { verifyConsent, type Purpose } from "../middleware/consent.js";
import { createAuditLog, getRequestMetadata } from "../middleware/audit.js";
import { filterPHI, getPatientSummary } from "../utils/pii-filter.js";

const app = new Hono();

// Apply auth to all routes
app.use("/*", requireAuth);

/**
 * GET /patients/:id
 * PIPA BC Compliant: Requires auth, consent verification, data minimization, and audit logging.
 */
const getPatientQuerySchema = z.object({
  purpose: z.enum([
    "treatment",
    "billing",
    "referral",
    "research",
    "emergency",
  ]),
});

app.get("/:id", zValidator("query", getPatientQuerySchema), async (c) => {
  const patientId = c.req.param("id");
  const { purpose } = c.req.valid("query");
  const user = c.get("user");
  const metadata = getRequestMetadata(c);

  // PIPA BC Requirement: Verify role has permission for this purpose
  const allowedPurposes = ROLE_PERMISSIONS[user.role] as readonly string[];
  if (!allowedPurposes.includes(purpose)) {
    await createAuditLog({
      action: "ACCESS_DENIED",
      resourceType: "patient",
      resourceId: patientId,
      userId: user.id,
      purpose,
      fieldsAccessed: [],
      ...metadata,
    });

    return c.json(
      { error: "Your role does not permit access for this purpose" },
      403
    );
  }

  // PIPA BC Requirement: Verify consent before data access
  const consentResult = await verifyConsent(
    patientId,
    purpose as Purpose,
    user.id
  );
  if (!consentResult.valid) {
    await createAuditLog({
      action: "ACCESS_DENIED",
      resourceType: "patient",
      resourceId: patientId,
      userId: user.id,
      purpose,
      fieldsAccessed: [],
      ...metadata,
    });

    return c.json(
      { error: `Consent verification failed: ${consentResult.reason}` },
      403
    );
  }

  // Fetch patient data
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
  });

  if (!patient) {
    return c.json({ error: "Patient not found" }, 404);
  }

  // PIPA BC Requirement: Apply data minimization based on purpose and role
  const filteredData = filterPHI(patient, purpose as Purpose, user.role);
  const { _accessedFields, ...responseData } = filteredData;

  // PIPA BC Requirement: Create audit log (without PHI values)
  await createAuditLog({
    action: "PATIENT_ACCESS",
    resourceType: "patient",
    resourceId: patientId,
    userId: user.id,
    purpose,
    fieldsAccessed: _accessedFields,
    ...metadata,
  });

  return c.json({
    data: responseData,
    consent: {
      verified: true,
      consentId: consentResult.consentId,
      expiresAt: consentResult.expiresAt,
    },
  });
});

/**
 * GET /patients/:id/summary
 * Minimal endpoint for basic patient lookup/verification.
 * PIPA BC Compliant: Returns only minimal identifying information.
 */
app.get("/:id/summary", async (c) => {
  const patientId = c.req.param("id");
  const user = c.get("user");
  const metadata = getRequestMetadata(c);

  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
  });

  if (!patient) {
    return c.json({ error: "Patient not found" }, 404);
  }

  // PIPA BC Requirement: Log even minimal access
  await createAuditLog({
    action: "PATIENT_ACCESS",
    resourceType: "patient_summary",
    resourceId: patientId,
    userId: user.id,
    purpose: "verification",
    fieldsAccessed: ["id", "initials", "dateOfBirth"],
    ...metadata,
  });

  return c.json({ data: getPatientSummary(patient) });
});

/**
 * POST /patients/:id/consent
 * Record new consent for a purpose.
 * PIPA BC Requirement: Track consent grants.
 */
const createConsentSchema = z.object({
  purpose: z.enum([
    "treatment",
    "billing",
    "referral",
    "research",
    "emergency",
  ]),
  grantedBy: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

app.post(
  "/:id/consent",
  requireRole(["physician", "nurse", "admin"]),
  zValidator("json", createConsentSchema),
  async (c) => {
    const patientId = c.req.param("id");
    const { purpose, grantedBy, expiresAt } = c.req.valid("json");
    const user = c.get("user");
    const metadata = getRequestMetadata(c);

    // Verify patient exists
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, patientId),
    });

    if (!patient) {
      return c.json({ error: "Patient not found" }, 404);
    }

    // Create consent record
    const consentId = uuidv4();
    await db.insert(consentRecords).values({
      id: consentId,
      patientId,
      purpose,
      grantedBy,
      grantedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    });

    // PIPA BC Requirement: Log consent grant
    await createAuditLog({
      action: "CONSENT_GRANTED",
      resourceType: "consent",
      resourceId: consentId,
      userId: user.id,
      purpose,
      ...metadata,
    });

    return c.json(
      {
        message: "Consent recorded successfully",
        consentId,
      },
      201
    );
  }
);

/**
 * DELETE /patients/:id/consent/:consentId
 * Withdraw consent.
 * PIPA BC Requirement: Individuals can withdraw consent at any time.
 */
app.delete("/:id/consent/:consentId", async (c) => {
  const patientId = c.req.param("id");
  const consentId = c.req.param("consentId");
  const user = c.get("user");
  const metadata = getRequestMetadata(c);

  // Find and update consent record
  const consent = await db.query.consentRecords.findFirst({
    where: eq(consentRecords.id, consentId),
  });

  if (!consent || consent.patientId !== patientId) {
    return c.json({ error: "Consent record not found" }, 404);
  }

  // Mark consent as withdrawn
  await db
    .update(consentRecords)
    .set({
      isActive: false,
      withdrawnAt: new Date(),
    })
    .where(eq(consentRecords.id, consentId));

  // PIPA BC Requirement: Log consent withdrawal
  await createAuditLog({
    action: "CONSENT_WITHDRAWN",
    resourceType: "consent",
    resourceId: consentId,
    userId: user.id,
    purpose: consent.purpose,
    ...metadata,
  });

  return c.json({ message: "Consent withdrawn successfully" });
});

export default app;
