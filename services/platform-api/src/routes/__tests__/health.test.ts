import request from "supertest";
import express from "express";
import { jest } from "@jest/globals";
import { createHealthRouter } from "../health.js";

/**
 * Mount the health router with a stubbed dbPing so tests don't need a real
 * Postgres connection.
 */
function buildAppWithPing(dbPing: () => Promise<void>) {
  const app = express();
  app.use("/health", createHealthRouter(dbPing));
  return app;
}

describe("GET /health", () => {
  it("returns 200 with status: ok and db: up when the DB ping resolves", async () => {
    const dbPing = jest.fn().mockResolvedValue(undefined);
    const app = buildAppWithPing(dbPing);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "up" });
    expect(dbPing).toHaveBeenCalledTimes(1);
  });

  it("returns 503 with status: degraded when the DB ping rejects", async () => {
    const dbPing = jest
      .fn()
      .mockRejectedValue(new Error("connection refused"));
    const app = buildAppWithPing(dbPing);

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      status: "degraded",
      db: "down",
      error: "connection refused",
    });
  });

  it("responds to a trailing slash too", async () => {
    const dbPing = jest.fn().mockResolvedValue(undefined);
    const app = buildAppWithPing(dbPing);

    const res = await request(app).get("/health/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "up" });
  });

  it("returns JSON content-type", async () => {
    const dbPing = jest.fn().mockResolvedValue(undefined);
    const app = buildAppWithPing(dbPing);

    const res = await request(app).get("/health");

    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});


