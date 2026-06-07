import { jest } from "@jest/globals";
import type { Context } from "hono";

type SecurityAlertPayload = {
  type: string;
  severity: "warning" | "critical";
  message: string;
  context?: Record<string, unknown>;
};

const sendSecurityAlert = jest
  .fn<(payload: SecurityAlertPayload) => Promise<void>>()
  .mockResolvedValue(undefined);
const values = jest.fn<(row: unknown) => Promise<void>>().mockResolvedValue(undefined);
const insert = jest.fn(() => ({ values }));

jest.unstable_mockModule("../../db/index.js", () => ({
  db: {
    insert,
  },
}));

jest.unstable_mockModule("../../utils/alert.js", () => ({
  sendSecurityAlert,
}));

const { createAuditLog, getRequestMetadata } = await import("../audit.js");

describe("createAuditLog", () => {
  beforeEach(() => {
    insert.mockClear();
    values.mockClear();
    sendSecurityAlert.mockClear();
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
    expect(sendSecurityAlert).not.toHaveBeenCalled();
  });

  it("sends a metadata-only security alert when fieldsAccessed contains a SIN-like pattern", async () => {
    await createAuditLog({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      fieldsAccessed: ["firstName", "123-456-789"],
    });

    expect(sendSecurityAlert).toHaveBeenCalledTimes(1);
    expect(sendSecurityAlert).toHaveBeenCalledWith({
      type: "phi_in_audit_log",
      severity: "warning",
      message: "Possible PHI detected in audit log fields",
      context: {
        matchedPattern: "/\\d{3}-\\d{3}-\\d{3}/",
        action: "PATIENT_ACCESS",
        resourceType: "patient",
      },
    });

    const alertPayload = sendSecurityAlert.mock.calls[0][0];
    const serializedAlert = JSON.stringify(alertPayload);
    expect(serializedAlert).not.toContain("123-456-789");
    expect(serializedAlert).not.toContain("fieldsAccessed");
    // Should still have inserted the row (alerting is non-blocking)
    expect(values).toHaveBeenCalledTimes(1);
  });

  it("sends a security alert when fieldsAccessed contains a 10-digit PHN", async () => {
    await createAuditLog({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      fieldsAccessed: ["healthCardNumber:9876543210"],
    });

    expect(sendSecurityAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "phi_in_audit_log",
        severity: "warning",
        context: expect.objectContaining({
          matchedPattern: "/\\d{10}/",
        }),
      })
    );
  });

  it("sends a security alert without field values when fieldsAccessed contains an email", async () => {
    await createAuditLog({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      fieldsAccessed: ["patientName:Alex Smith", "email:alex@example.com"],
    });

    expect(sendSecurityAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "phi_in_audit_log",
        severity: "warning",
        context: expect.objectContaining({
          matchedPattern: "/@.*\\.(com|ca|org)/",
          action: "PATIENT_ACCESS",
          resourceType: "patient",
        }),
      })
    );

    const alertPayload = sendSecurityAlert.mock.calls[0][0];
    const serializedAlert = JSON.stringify(alertPayload);
    expect(serializedAlert).not.toContain("Alex Smith");
    expect(serializedAlert).not.toContain("alex@example.com");
  });

  it("does not alert when fieldsAccessed contains only field names", async () => {
    await createAuditLog({
      action: "PATIENT_ACCESS",
      resourceType: "patient",
      resourceId: "p-1",
      userId: "u-1",
      fieldsAccessed: ["firstName", "lastName", "dateOfBirth"],
    });

    expect(sendSecurityAlert).not.toHaveBeenCalled();
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
