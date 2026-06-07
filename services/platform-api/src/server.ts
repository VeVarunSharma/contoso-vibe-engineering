import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { rateLimit } from "express-rate-limit";
import { logger } from "./logger.js";
import healthRoutes from "./routes/health.js";
import usersRoutes from "./routes/users.js";

export const createServer = (): Express => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Rate limiting — protect against DoS / brute force.
  // Conservative defaults; production deployments should swap the in-memory
  // store for Redis (or another shared store) to coordinate across instances.
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });

  app.use(generalLimiter);

  app.use("/health", healthRoutes);
  app.use("/users", usersRoutes);

  return app;
};
