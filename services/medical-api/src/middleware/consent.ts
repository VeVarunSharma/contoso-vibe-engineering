import { db } from "../db/index.js";
import { consentRecords } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * PIPA BC Requirement: Consent must be obtained before collecting,
 * using, or disclosing personal information. Organizations must
 * verify consent is valid, not expired, and not withdrawn.
 */

export interface ConsentVerificationResult {
  valid: boolean;
  consentId?: string;
  expiresAt?: Date;
  reason?: string;
}

export type Purpose =
  | "treatment"
  | "billing"
  | "referral"
  | "research"
  | "emergency";

/**
 * Verifies if valid consent exists for accessing patient data.
 * PIPA BC Requirement: Check consent before any data access.
 *
 * @param patientId - The patient's unique identifier
 * @param purpose - The purpose for accessing the data
 * @param _requesterId - The ID of the person requesting access (for audit)
 */
export async function verifyConsent(
  patientId: string,
  purpose: Purpose,
  _requesterId: string
): Promise<ConsentVerificationResult> {
  // PIPA BC: Emergency access may be permitted without explicit consent
  // in life-threatening situations, but must still be logged
  if (purpose === "emergency") {
    return {
      valid: true,
      reason: "Emergency access permitted under PIPA BC Section 18",
    };
  }

  // Find active consent for this patient and purpose
  const consent = await db.query.consentRecords.findFirst({
    where: and(
      eq(consentRecords.patientId, patientId),
      eq(consentRecords.purpose, purpose),
      eq(consentRecords.isActive, true)
    ),
  });

  if (!consent) {
    return {
      valid: false,
      reason: "No active consent found for this purpose",
    };
  }

  // Check if consent has been withdrawn
  if (consent.withdrawnAt) {
    return {
      valid: false,
      reason: "Consent has been withdrawn",
    };
  }

  // Check if consent has expired
  if (consent.expiresAt && consent.expiresAt < new Date()) {
    return {
      valid: false,
      reason: "Consent has expired",
    };
  }

  return {
    valid: true,
    consentId: consent.id,
    expiresAt: consent.expiresAt ?? undefined,
  };
}
