import { jest } from "@jest/globals";
import type { Context } from "hono";

const values = jest.fn<(row: unknown) => Promise<void>>().mockResolvedValue(undefined);
const insert = jest.fn(() => ({ values }));

jest.unstable_mockModule("../../db/index.js", () => ({
  db: {
    insert,
  },
}));

const { createAuditLog, getRequestMetadata } = await import("../audit.js");

describe("createAuditLog", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    insert.mockClear();
    values.mockClear();
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("inserts a basic audit entry with field metadata", async () => {
    await createAuditLog({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      purpose: "treatment",
      fieldsAccessed: ["firstName", "lastName"],
      ipAddress: "10.0.0.1",
      userAgent: "vitest",
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledTimes(1);
    const inserted = values.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted).toMatchObject({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      purpose: "treatment",
      fieldsAccessed: ["firstName", "lastName"],
      ipAddress: "10.0.0.1",
      userAgent: "vitest",
    });
    expect(inserted.id).toEqual(expect.any(String));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("emits a SECURITY WARNING when fieldsAccessed contains a SIN-like pattern", async () => {
    await createAuditLog({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      fieldsAccessed: ["firstName", "123-456-789"],
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SECURITY WARNING")
    );
    // Should still have inserted the row (warning is non-blocking)
    expect(values).toHaveBeenCalledTimes(1);
  });

  it("emits a SECURITY WARNING when fieldsAccessed contains a 10-digit PHN", async () => {
    await createAuditLog({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      fieldsAccessed: ["healthCardNumber:9876543210"],
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SECURITY WARNING")
    );
  });

  it("emits a SECURITY WARNING when fieldsAccessed contains an email", async () => {
    await createAuditLog({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      fieldsAccessed: ["email:alex@example.com"],
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SECURITY WARNING")
    );
  });

  it("does not warn when fieldsAccessed contains only field names", async () => {
    await createAuditLog({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      fieldsAccessed: ["firstName", "lastName", "dateOfBirth"],
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("normalises fieldsAccessed to null when omitted", async () => {
    await createAuditLog({
      action: "ACCESS_DENIED",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
    });

    const inserted = values.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted.fieldsAccessed).toBeNull();
  });
});

describe("getRequestMetadata", () => {
  function buildContext(headers: Record<string, string>): Context {
    return {
      req: {
        header: (name: string): string | undefined => headers[name],
      },
    } as unknown as Context;
  }

  it("prefers X-Forwarded-For for ip address", () => {
    const result = getRequestMetadata(
      buildContext({
        "X-Forwarded-For": "10.0.0.1",
        "X-Real-IP": "10.0.0.2",
        "User-Agent": "agent",
      })
    );
    expect(result.ipAddress).toBe("10.0.0.1");
    expect(result.userAgent).toBe("agent");
  });

  it("falls back to X-Real-IP when X-Forwarded-For is missing", () => {
    const result = getRequestMetadata(
      buildContext({
        "X-Real-IP": "10.0.0.2",
        "User-Agent": "agent",
      })
    );
    expect(result.ipAddress).toBe("10.0.0.2");
  });

  it("returns 'unknown' for both fields when headers are missing", () => {
    const result = getRequestMetadata(buildContext({}));
    expect(result.ipAddress).toBe("unknown");
    expect(result.userAgent).toBe("unknown");
  });
});
