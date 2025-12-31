/**
 * ⚠️ WARNING: NON-COMPLIANT DEMO FILE ⚠️
 *
 * This file intentionally violates PIPA BC (Personal Information Protection Act)
 * requirements for demonstration purposes. DO NOT use this code in production.
 *
 * This demonstrates what the GitHub Copilot CLI compliance agent should catch
 * during CI/CD pipeline execution.
 *
 * See: services/medical-api/PIPA_COMPLIANCE.md for correct implementation patterns.
 */

import { Hono } from "hono";
import { db } from "../db/index.js";
import { patients, consentRecords } from "../db/schema.js";
import { eq } from "drizzle-orm";

const app = new Hono();

// ❌ VIOLATION 8: Hardcoded credentials in source code
// PIPA BC Section 34: These would be caught by secret scanning and compliance checks
const API_SECRET_KEY = "sk-prod-12345-abcdef-secret-key"; // NEVER DO THIS!
const DATABASE_PASSWORD = "super_secret_password_123"; // NEVER DO THIS!
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.admin-token"; // NEVER DO THIS!

// ❌ VIOLATION 1: No authentication middleware applied
// PIPA BC Section 34 requires protecting personal information with appropriate security
// This endpoint is accessible to ANYONE without authentication
app.get("/:id", async (c) => {
  const patientId = c.req.param("id");

  // ❌ VIOLATION 7: No purpose validation
  // PIPA BC Section 11 requires purpose limitation - data should only be used
  // for the purpose for which it was collected. No purpose is required or validated here.
  const purpose = c.req.query("purpose"); // Optional and ignored!

  // ❌ VIOLATION 2: No consent verification before data access
  // PIPA BC Section 6 requires consent before collecting, using, or disclosing
  // personal information. We skip consent verification entirely here.

  // Fetch patient data without any checks
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, patientId),
  });

  if (!patient) {
    return c.json({ error: "Patient not found" }, 404);
  }

  // ❌ VIOLATION 4: Logging PHI values to console
  // PIPA BC Section 34 requires protecting personal information.
  // Logging PHI creates security risks and compliance violations.
  console.log(
    `[PATIENT ACCESS] Retrieved patient: ${patient.firstName} ${patient.lastName}`
  );
  console.log(`[PATIENT ACCESS] SIN: ${patient.socialInsuranceNumber}`);
  console.log(
    `[PATIENT ACCESS] Health Card (PHN): ${patient.healthCardNumber}`
  );
  console.log(
    `[PATIENT ACCESS] Email: ${patient.email}, Phone: ${patient.phoneNumber}`
  );
  console.log(
    `[PATIENT ACCESS] Full medical history: ${JSON.stringify(patient.medicalHistory)}`
  );
  console.log(
    `[PATIENT ACCESS] All medications: ${JSON.stringify(patient.medications)}`
  );

  // ❌ VIOLATION 6: No audit logging
  // PIPA BC Section 34 requires maintaining audit trails for accountability.
  // We don't create any audit log entries here.

  // ❌ VIOLATION 3: Returns ALL patient fields including SIN, health card
  // PIPA BC Section 4 requires data minimization - collecting only minimum
  // personal information necessary. We return everything!
  return c.json({
    data: patient, // Returns ALL fields: SIN, PHN, medical history, insurance, etc.
    message: "Full patient record returned without filtering",
    // Bonus violation: exposing internal details
    _internal: {
      dbQuery: `SELECT * FROM patients WHERE id = '${patientId}'`,
      apiKey: API_SECRET_KEY, // ❌ Exposing secrets in response!
    },
  });
});

/**
 * ❌ VIOLATION 5: Bulk export endpoint with no access controls
 * PIPA BC requires protecting personal information and limiting access.
 * This endpoint exposes ALL patient data to anyone!
 */
app.get("/export/all", async (c) => {
  // ❌ VIOLATION 1: No authentication - anyone can access this
  // ❌ VIOLATION 2: No consent verification for any patient
  // ❌ VIOLATION 7: No purpose validation for bulk access

  // ❌ VIOLATION 4: Logging sensitive operation without controls
  console.log("[BULK EXPORT] Exporting ALL patient records...");
  console.log(`[BULK EXPORT] Using API key: ${API_SECRET_KEY}`);

  // Fetch ALL patients without any filtering or access control
  const allPatients = await db.query.patients.findMany();

  // ❌ VIOLATION 4: Logging PHI for all patients
  allPatients.forEach((patient) => {
    console.log(
      `[BULK EXPORT] Patient: ${patient.firstName} ${patient.lastName}, ` +
        `SIN: ${patient.socialInsuranceNumber}, PHN: ${patient.healthCardNumber}`
    );
  });

  // ❌ VIOLATION 6: No audit logging for bulk export

  // ❌ VIOLATION 3: Returns all data without minimization
  return c.json({
    totalRecords: allPatients.length,
    exportedAt: new Date().toISOString(),
    patients: allPatients, // ALL fields for ALL patients!
    _exportMetadata: {
      exportedBy: "anonymous", // No user tracking
      purpose: "unknown", // No purpose limitation
      consentVerified: false, // Explicitly not verified
    },
  });
});

/**
 * ❌ Search endpoint with multiple violations
 */
app.get("/search", async (c) => {
  const searchTerm = c.req.query("q") || "";

  // ❌ VIOLATION 1: No authentication
  // ❌ VIOLATION 2: No consent verification
  // ❌ VIOLATION 7: No purpose validation

  // ❌ VIOLATION 4: Logging search queries which may contain PHI
  console.log(`[SEARCH] Searching for patients matching: ${searchTerm}`);

  // Fetch all patients and filter (inefficient AND insecure)
  const allPatients = await db.query.patients.findMany();

  const results = allPatients.filter(
    (p) =>
      p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.socialInsuranceNumber?.includes(searchTerm) || // Allowing SIN search!
      p.healthCardNumber?.includes(searchTerm) // Allowing PHN search!
  );

  // ❌ VIOLATION 4: Logging search results with PHI
  console.log(`[SEARCH] Found ${results.length} patients:`);
  results.forEach((p) => {
    console.log(
      `  - ${p.firstName} ${p.lastName} (SIN: ${p.socialInsuranceNumber})`
    );
  });

  // ❌ VIOLATION 6: No audit logging

  // ❌ VIOLATION 3: Returns unfiltered results
  return c.json({
    query: searchTerm,
    count: results.length,
    patients: results, // All fields exposed
  });
});

/**
 * ❌ Update patient without proper controls
 */
app.put("/:id", async (c) => {
  const patientId = c.req.param("id");

  // ❌ VIOLATION 1: No authentication - anyone can update records!
  // ❌ VIOLATION 2: No consent verification for updates
  // ❌ VIOLATION 7: No purpose validation

  const body = await c.req.json();

  // ❌ VIOLATION 4: Logging update content which contains PHI
  console.log(`[UPDATE] Updating patient ${patientId} with data:`);
  console.log(`[UPDATE] New values: ${JSON.stringify(body)}`);

  // ❌ VIOLATION 6: No audit logging for data modification

  // Note: Not actually updating in this demo to avoid breaking things
  // But the violations are still present in the code structure

  return c.json({
    message: "Patient updated (demo - no actual update)",
    patientId,
    updatedFields: Object.keys(body),
    _warning: "This endpoint has no security controls!",
  });
});

/**
 * ❌ Delete patient without proper controls
 */
app.delete("/:id", async (c) => {
  const patientId = c.req.param("id");

  // ❌ VIOLATION 1: No authentication
  // ❌ VIOLATION 2: No consent verification
  // ❌ VIOLATION 7: No purpose validation

  // ❌ VIOLATION 4: Logging deletion
  console.log(`[DELETE] Deleting patient record: ${patientId}`);
  console.log(`[DELETE] This action is permanent and unaudited!`);

  // ❌ VIOLATION 6: No audit logging for data deletion

  // Note: Not actually deleting in this demo
  return c.json({
    message: "Patient deleted (demo - no actual delete)",
    patientId,
    _warning: "This deletion was not authenticated, consented, or audited!",
  });
});

/**
 * ❌ Consent management without proper controls
 * Even consent endpoints should be protected!
 */
app.post("/:id/consent", async (c) => {
  const patientId = c.req.param("id");
  const body = await c.req.json();

  // ❌ VIOLATION 1: No authentication - anyone can grant consent!
  // This is a critical violation as consent fraud is possible

  // ❌ VIOLATION 4: Logging consent details
  console.log(`[CONSENT] Creating consent for patient ${patientId}`);
  console.log(
    `[CONSENT] Purpose: ${body.purpose}, Granted by: ${body.grantedBy}`
  );

  // ❌ VIOLATION 6: Ironically, even consent creation isn't audited

  return c.json({
    message: "Consent recorded (demo - no actual record)",
    patientId,
    _warning: "Consent was created without verifying the requester's identity!",
  });
});

/**
 * ❌ Debug endpoint exposing system information
 * This should NEVER exist in production!
 */
app.get("/debug/info", async (c) => {
  // ❌ VIOLATION 1: No authentication on debug endpoint
  // ❌ VIOLATION 8: Exposing credentials and system info

  console.log("[DEBUG] Debug endpoint accessed - exposing system info");

  return c.json({
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL, // ❌ Exposing connection string!
    credentials: {
      apiKey: API_SECRET_KEY,
      dbPassword: DATABASE_PASSWORD,
      adminToken: ADMIN_TOKEN,
    },
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
    },
    _message: "This endpoint exposes critical security information!",
  });
});

export default app;
