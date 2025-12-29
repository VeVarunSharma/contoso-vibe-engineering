import { db } from "../db/index.js";
import { auditLogs } from "../db/schema.js";
import { v4 as uuidv4 } from "uuid";
import type { Context } from "hono";

/**
 * PIPA BC Requirement: Organizations must protect personal information
 * and be able to demonstrate compliance. Audit logs are essential
 * for accountability.
 *
 * CRITICAL: Audit logs must NEVER contain actual PHI values.
 * Only log metadata: who, what resource type, when, why, which fields (not values).
 */

export interface AuditLogEntry {
  action:
    | "PATIENT_ACCESS"
    | "PATIENT_UPDATE"
    | "ACCESS_DENIED"
    | "CONSENT_GRANTED"
    | "CONSENT_WITHDRAWN";
  resourceType: string;
  resourceId: string;
  userId: string;
  purpose?: string;
  fieldsAccessed?: string[];
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates an audit log entry.
 * PIPA BC Requirement: Log all access to personal information.
 *
 * @param entry - The audit log entry (must not contain PHI values)
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  // PIPA BC: Validate that we're not accidentally logging PHI
  // This is a safeguard - the entry should never contain PHI
  if (entry.fieldsAccessed) {
    // Only field names are allowed, not values
    const suspiciousPatterns = [
      /\d{3}-\d{3}-\d{3}/, // SIN pattern
      /\d{10}/, // PHN pattern
      /@.*\.(com|ca|org)/, // Email pattern
    ];

    const fieldsStr = JSON.stringify(entry.fieldsAccessed);
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fieldsStr)) {
        console.error(
          "SECURITY WARNING: Possible PHI detected in audit log fields"
        );
        // In production, this should alert security team
        // TODO: Implement security alerting
      }
    }
  }

  await db.insert(auditLogs).values({
    id: uuidv4(),
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    userId: entry.userId,
    purpose: entry.purpose,
    fieldsAccessed: entry.fieldsAccessed ?? null,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
  });
}

/**
 * Helper to extract request metadata for audit logging.
 */
export function getRequestMetadata(c: Context): {
  ipAddress: string;
  userAgent: string;
} {
  return {
    ipAddress:
      c.req.header("X-Forwarded-For") ?? c.req.header("X-Real-IP") ?? "unknown",
    userAgent: c.req.header("User-Agent") ?? "unknown",
  };
}
