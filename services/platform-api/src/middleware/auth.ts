import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

/**
 * Bearer-token authentication middleware for the platform API.
 *
 * Reads the expected token from `PLATFORM_API_TOKEN`. On a mismatch (or
 * missing/malformed Authorization header) the request is rejected with 401
 * before reaching any route handler.
 *
 * The comparison is performed with `crypto.timingSafeEqual` to avoid
 * leaking timing information about the configured token.
 *
 * PRODUCTION TODO: Replace this static-token flow with a real auth provider
 * (e.g. JWT issued by Entra ID / Auth0 / Keycloak). The static-token mode is
 * sufficient for the demo but should not be used in production.
 */
export function requireBearerToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const expected = process.env.PLATFORM_API_TOKEN;

  if (!expected || expected.length < 32) {
    console.error(
      "PLATFORM_API_TOKEN is not configured (or shorter than 32 chars). Refusing all requests.",
    );
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  const header = req.header("authorization") ?? req.header("Authorization");

  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const provided = header.slice("bearer ".length).trim();
  if (!provided) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  if (
    expectedBuf.length !== providedBuf.length ||
    !timingSafeEqual(expectedBuf, providedBuf)
  ) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  next();
}
