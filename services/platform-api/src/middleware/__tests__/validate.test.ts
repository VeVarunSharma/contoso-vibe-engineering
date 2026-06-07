import express from "express";
import request from "supertest";
import { z } from "zod";
import { users } from "../../db/schema.js";
import { createUsersRouter } from "../../routes/users.js";
import { validate, type ValidatedRequest } from "../validate.js";

const authToken = "test-platform-token-123456789012345";

type UserRecord = typeof users.$inferSelect;
type FindManyOptions = { limit: number; offset: number };

beforeAll(() => {
  process.env.PLATFORM_API_TOKEN = authToken;
});

describe("validate middleware", () => {
  it("rejects an invalid body with 400 and structured Zod issues", async () => {
    const bodySchema = z.object({ name: z.string().min(1) });
    const app = express();

    app.use(express.json());
    app.post("/widgets", validate({ body: bodySchema }), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const res = await request(app).post("/widgets").send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "Validation failed" });
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details[0]).toMatchObject({ path: ["name"] });
  });

  it("accepts a valid body with 200", async () => {
    const bodySchema = z.object({ name: z.string().min(1) });
    const app = express();

    app.use(express.json());
    app.post("/widgets", validate({ body: bodySchema }), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const res = await request(app).post("/widgets").send({ name: "Mona" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("coerces query params and exposes parsed values to handlers", async () => {
    const querySchema = z.object({ limit: z.coerce.number().int().positive() });
    const app = express();

    app.get("/search", validate({ query: querySchema }), (req, res) => {
      const parsedReq = req as unknown as ValidatedRequest<
        undefined,
        typeof querySchema
      >;
      res.status(200).json({
        limit: parsedReq.query.limit,
        limitType: typeof parsedReq.query.limit,
      });
    });

    const res = await request(app).get("/search?limit=3");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ limit: 3, limitType: "number" });
  });

  it("replaces req.body with parsed values", async () => {
    const bodySchema = z.object({ count: z.coerce.number().int().positive() });
    const app = express();

    app.use(express.json());
    app.post("/counts", validate({ body: bodySchema }), (req, res) => {
      const parsedReq = req as unknown as ValidatedRequest<typeof bodySchema>;
      res.status(200).json({
        count: parsedReq.body.count,
        countType: typeof parsedReq.body.count,
      });
    });

    const res = await request(app).post("/counts").send({ count: "7" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 7, countType: "number" });
  });
});

describe("GET /users validation", () => {
  const records: UserRecord[] = [
    {
      id: 1,
      name: "Mona Lisa",
      email: "mona@example.com",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    },
    {
      id: 2,
      name: "Octo Cat",
      email: "octo@example.com",
      createdAt: new Date("2024-01-02T00:00:00.000Z"),
    },
    {
      id: 3,
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date("2024-01-03T00:00:00.000Z"),
    },
  ];

  const buildUsersApp = () => {
    let observedOptions: FindManyOptions | undefined;
    const database = {
      query: {
        users: {
          findMany: async (options: FindManyOptions): Promise<UserRecord[]> => {
            observedOptions = options;
            return records.slice(options.offset, options.offset + options.limit);
          },
        },
      },
    };
    const app = express();

    app.use(express.json());
    app.use("/users", createUsersRouter(database));

    return { app, getObservedOptions: () => observedOptions };
  };

  it("returns 400 with the validation error shape on bad input", async () => {
    const { app } = buildUsersApp();

    const res = await request(app)
      .get("/users?limit=0")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: "Validation failed" });
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details[0]).toMatchObject({ path: ["limit"] });
  });

  it("returns at most limit rows and honors offset", async () => {
    const { app, getObservedOptions } = buildUsersApp();

    const res = await request(app)
      .get("/users?limit=2&offset=1")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((user: { id: number }) => user.id)).toEqual([2, 3]);
    expect(getObservedOptions()).toEqual({ limit: 2, offset: 1 });
  });
});
