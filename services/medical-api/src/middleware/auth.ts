import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { jwtVerify, type JWTPayload } from "jose";

/**
 * PIPA BC Requirement: Organizations must limit access to personal
 * information to those who need it to perform their duties.
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "physician" | "nurse" | "admin" | "billing" | "receptionist";
  department?: string;
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

const VALID_ROLES = new Set<AuthUser["role"]>([
  "physician",
  "nurse",
  "admin",
  "billing",
  "receptionist",
]);

interface MedicalJWTClaims extends JWTPayload {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  department?: string;
}

let cachedSecret: Uint8Array | null = null;

const getSecret = (): Uint8Array => {
  if (cachedSecret) return cachedSecret;

  const raw = process.env.MEDICAL_API_JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "MEDICAL_API_JWT_SECRET must be set to a value of at least 32 characters",
    );
  }

  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
};

// Test-only hook so unit tests can reset the cached secret between cases.
export const __resetSecretCache = () => {
  cachedSecret = null;
};

/**
 * Authentication middleware. Validates a Bearer JWT signed with HS256 and
 * keyed by the MEDICAL_API_JWT_SECRET environment variable.
 *
 * PIPA BC Requirement: Validate user is authenticated before accessing PHI.
 *
 * PRODUCTION TODO: Move to RS256 with a managed key (Azure Key Vault / Entra
 * ID) and rotate signing keys regularly. The HS256 + shared-secret flow here
 * is appropriate only for the demo.
 */
export const requireAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization") ?? c.req.header("authorization");

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new HTTPException(401, {
      message: "Authentication required",
    });
  }

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    throw new HTTPException(401, {
      message: "Authentication required",
    });
  }

  let claims: MedicalJWTClaims;
  try {
    const result = await jwtVerify<MedicalJWTClaims>(token, getSecret(), {
      algorithms: ["HS256"],
    });
    claims = result.payload;
  } catch {
    // Don't leak which part of verification failed (signature vs. expiry).
    throw new HTTPException(401, {
      message: "Invalid or expired token",
    });
  }

  if (!claims.sub || typeof claims.sub !== "string") {
    throw new HTTPException(401, {
      message: "Invalid token claims",
    });
  }

  if (!claims.role || !VALID_ROLES.has(claims.role as AuthUser["role"])) {
    throw new HTTPException(401, {
      message: "Invalid token claims",
    });
  }

  c.set("user", {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "unknown@example.com",
    name: typeof claims.name === "string" ? claims.name : "Unknown User",
    role: claims.role as AuthUser["role"],
    ...(typeof claims.department === "string" && { department: claims.department }),
  });

  await next();
};

/**
 * Role-based access control middleware.
 * PIPA BC Requirement: Access must be limited based on job function.
 */
export const requireRole = (allowedRoles: AuthUser["role"][]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user || !allowedRoles.includes(user.role)) {
      throw new HTTPException(403, {
        message: "Insufficient permissions for this resource",
      });
    }

    await next();
  };
};

/**
 * Define which roles can access which data types.
 * PIPA BC Requirement: Purpose-based access restrictions.
 */
export const ROLE_PERMISSIONS = {
  physician: ["treatment", "referral", "emergency"],
  nurse: ["treatment", "emergency"],
  admin: ["billing"],
  billing: ["billing"],
  receptionist: ["emergency"],
} as const;
