import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import usersRoutes from "./routes/users.js";

export const createServer = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/health", healthRoutes);
  app.use("/users", usersRoutes);

  return app;
};
