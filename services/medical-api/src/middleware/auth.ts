import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

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

/**
 * Mock authentication middleware for demo purposes.
 * PIPA BC Requirement: Validate user is authenticated before accessing PHI.
 *
 * TODO: In production, implement real JWT validation
 */
export const requireAuth = async (c: Context, next: Next) => {
  // Mock: Extract user from header (in production, validate JWT)
  const userId = c.req.header("X-User-Id");
  const userRole = c.req.header("X-User-Role") as AuthUser["role"];
  const userName = c.req.header("X-User-Name") ?? "Unknown User";
  const userEmail = c.req.header("X-User-Email") ?? "unknown@example.com";

  if (!userId || !userRole) {
    throw new HTTPException(401, {
      message: "Authentication required",
    });
  }

  // Set user in context
  c.set("user", {
    id: userId,
    email: userEmail,
    name: userName,
    role: userRole,
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
