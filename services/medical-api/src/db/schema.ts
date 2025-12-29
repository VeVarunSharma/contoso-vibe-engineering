import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * PIPA BC Requirement: Personal health information must be clearly defined
 * and protected. This schema identifies sensitive PHI fields.
 */

// Healthcare staff users (for auth demo)
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", {
    enum: ["physician", "nurse", "admin", "billing", "receptionist"],
  }).notNull(),
  department: text("department"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Patient health records with sensitive PHI
export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(), // UUID
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // ISO date string
  // PIPA BC: Sensitive - Social Insurance Number
  socialInsuranceNumber: text("social_insurance_number"),
  // PIPA BC: Sensitive - BC Personal Health Number
  healthCardNumber: text("health_card_number"),
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  // PIPA BC: Sensitive - Medical history (JSON)
  medicalHistory: text("medical_history", { mode: "json" }),
  // PIPA BC: Sensitive - Current medications (JSON)
  medications: text("medications", { mode: "json" }),
  // Allergies (JSON)
  allergies: text("allergies", { mode: "json" }),
  // PIPA BC: Sensitive - Insurance information (JSON)
  insuranceInfo: text("insurance_info", { mode: "json" }),
  // Emergency contacts (JSON)
  emergencyContacts: text("emergency_contacts", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * PIPA BC Requirement: Consent must be obtained before collecting,
 * using, or disclosing personal information.
 */
export const consentRecords = sqliteTable("consent_records", {
  id: text("id").primaryKey(), // UUID
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id),
  purpose: text("purpose", {
    enum: ["treatment", "billing", "referral", "research", "emergency"],
  }).notNull(),
  grantedBy: text("granted_by").notNull(), // Who gave consent
  grantedAt: integer("granted_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  withdrawnAt: integer("withdrawn_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

/**
 * PIPA BC Requirement: Organizations must protect personal information
 * and maintain audit trails of access.
 *
 * CRITICAL: This table must NEVER store actual PHI values,
 * only metadata about access.
 */
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(), // UUID
  action: text("action", {
    enum: [
      "PATIENT_ACCESS",
      "PATIENT_UPDATE",
      "ACCESS_DENIED",
      "CONSENT_GRANTED",
      "CONSENT_WITHDRAWN",
    ],
  }).notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(), // NOT the actual patient data
  userId: text("user_id").notNull(), // Who performed the action
  purpose: text("purpose"), // Why they accessed
  // PIPA BC: Log field names only, NEVER values
  fieldsAccessed: text("fields_accessed", { mode: "json" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  consentRecords: many(consentRecords),
}));

export const consentRecordsRelations = relations(consentRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [consentRecords.patientId],
    references: [patients.id],
  }),
}));
