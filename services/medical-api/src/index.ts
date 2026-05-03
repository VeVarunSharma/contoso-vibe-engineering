import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { rateLimiter } from "hono-rate-limiter";
import patientsRouter from "./routes/patients.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Rate limiting (PIPA BC: protect PHI endpoints from abuse / brute force).
// Conservative defaults that should comfortably accommodate legitimate UI
// usage while throttling automated scraping and credential-stuffing attempts.
//
// PRODUCTION TODO: replace the in-memory store with Redis (or another shared
// store) once we run more than one instance.
const generalLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown",
});

const phiLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown",
});

app.use("*", generalLimiter);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "medical-api" });
});

// Tighter limit on PHI endpoints
app.use("/api/patients/*", phiLimiter);

// Mount routes
app.route("/api/patients", patientsRouter);

// Error handling - PIPA BC: Don't expose internal errors
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error("Unhandled error:", err);
  // Don't expose internal error details
  return c.json({ error: "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

const port = parseInt(process.env.PORT ?? "3001", 10);

console.log(`🏥 Medical API starting on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});
