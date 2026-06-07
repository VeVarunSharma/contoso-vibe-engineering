import request from "supertest";
import { createServer } from "../../server.js";

describe("GET /health", () => {
  const app = createServer();

  it("returns 200 with status: ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("responds to a trailing slash too", async () => {
    const res = await request(app).get("/health/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns JSON content-type", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});
