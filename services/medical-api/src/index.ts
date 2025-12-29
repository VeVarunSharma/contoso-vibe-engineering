import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import patientsRouter from "./routes/patients.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "medical-api" });
});

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
