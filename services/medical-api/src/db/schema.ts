import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * PIPA BC Requirement: Personal health information must be clearly defined
 * and protected. This schema identifies sensitive PHI fields.
 */

// Healthcare staff users (for auth demo)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", {
    enum: ["physician", "nurse", "admin", "billing", "receptionist"],
  }).notNull(),
  department: text("department"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Patient health records with sensitive PHI
export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  medicalHistory: jsonb("medical_history"),
  // PIPA BC: Sensitive - Current medications (JSON)
  medications: jsonb("medications"),
  // Allergies (JSON)
  allergies: jsonb("allergies"),
  // PIPA BC: Sensitive - Insurance information (JSON)
  insuranceInfo: jsonb("insurance_info"),
  // Emergency contacts (JSON)
  emergencyContacts: jsonb("emergency_contacts"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * PIPA BC Requirement: Consent must be obtained before collecting,
 * using, or disclosing personal information.
 */
export const consentRecords = pgTable("consent_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),
  purpose: text("purpose", {
    enum: ["treatment", "billing", "referral", "research", "emergency"],
  }).notNull(),
  grantedBy: text("granted_by").notNull(), // Who gave consent
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  withdrawnAt: timestamp("withdrawn_at"),
  isActive: boolean("is_active").notNull().default(true),
});

/**
 * PIPA BC Requirement: Organizations must protect personal information
 * and maintain audit trails of access.
 *
 * CRITICAL: This table must NEVER store actual PHI values,
 * only metadata about access.
 */
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  fieldsAccessed: jsonb("fields_accessed"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
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
