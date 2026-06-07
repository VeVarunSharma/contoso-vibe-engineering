import { Router, type Router as RouterType } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { logger } from "../logger.js";
import { validate } from "../middleware/validate.js";
import { healthParams, healthQuery } from "../validators/health.validators.js";

/**
 * Default implementation: runs a trivial `SELECT 1` against the configured
 * Postgres pool. Exposed as a parameter to `createHealthRouter` so tests
 * can inject a fake without needing a live DB connection.
 */
export const defaultDbPing = async (): Promise<void> => {
  await db.execute(sql`SELECT 1`);
};

export const createHealthRouter = (
  dbPing: () => Promise<void> = defaultDbPing,
): RouterType => {
  const router = Router();

  router.get(
    "/",
    validate({ query: healthQuery, params: healthParams }),
    async (req, res) => {
      try {
        await dbPing();
        return res.status(200).json({ status: "ok", db: "up" });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Database health check failed";
        (req.log ?? logger).error({ err }, "Health check DB error");
        return res
          .status(503)
          .json({ status: "degraded", db: "down", error: message });
      }
    },
  );

  return router;
};

const router: RouterType = createHealthRouter();

export default router;
