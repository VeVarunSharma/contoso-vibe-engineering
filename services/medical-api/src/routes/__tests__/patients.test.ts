import { jest } from "@jest/globals";
import { SignJWT } from "jose";

type Role = "physician" | "nurse" | "admin" | "billing" | "receptionist";

const findConsent = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const updateWhere = jest.fn<(...args: unknown[]) => Promise<void>>();
const set = jest.fn(() => ({ where: updateWhere }));
const update = jest.fn(() => ({ set }));
const createAuditLog = jest
  .fn<(...args: unknown[]) => Promise<void>>()
  .mockResolvedValue(undefined);
const getRequestMetadata = jest.fn(() => ({
  ipAddress: "127.0.0.1",
  userAgent: "jest",
}));

jest.unstable_mockModule("../../db/index.js", () => ({
  db: {
    query: {
      consentRecords: {
        findFirst: findConsent,
      },
    },
    update,
  },
}));

jest.unstable_mockModule("../../middleware/audit.js", () => ({
  createAuditLog,
  getRequestMetadata,
}));

const [{ default: patientsRouter }, { __resetSecretCache }] = await Promise.all([
  import("../patients.js"),
  import("../../middleware/auth.js"),
]);

const JWT_SECRET = "medical-api-test-secret-at-least-32-characters";
const JWT_SECRET_ENV = "MEDICAL_API_JWT_SECRET";

async function createToken(role: Role): Promise<string> {
  return new SignJWT({
    email: `${role}@example.com`,
    name: `${role} user`,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(`${role}-user`)
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(JWT_SECRET));
}

async function withdrawConsent(role: Role): Promise<Response> {
  const token = await createToken(role);

  return patientsRouter.request("/patient-1/consent/consent-1", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

describe("DELETE /:id/consent/:consentId authorization", () => {
  beforeAll(() => {
    process.env[JWT_SECRET_ENV] = JWT_SECRET;
  });

  beforeEach(() => {
    __resetSecretCache();
    findConsent.mockReset();
    updateWhere.mockReset().mockResolvedValue(undefined);
    set.mockClear();
    update.mockClear();
    createAuditLog.mockClear();
    getRequestMetadata.mockClear();
  });

  afterAll(() => {
    delete process.env[JWT_SECRET_ENV];
    __resetSecretCache();
  });

  it("allows an admin to withdraw consent and preserves the audit trail", async () => {
    findConsent.mockResolvedValue({
      id: "consent-1",
      patientId: "patient-1",
      purpose: "treatment",
    });

    const response = await withdrawConsent("admin");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Consent withdrawn successfully",
    });
    expect(findConsent).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(getRequestMetadata).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({
      isActive: false,
      withdrawnAt: expect.any(Date),
    });
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CONSENT_WITHDRAWN",
        resourceType: "consent",
        resourceId: "consent-1",
        userId: "admin-user",
        purpose: "treatment",
      })
    );
  });

  it.each<Role>(["physician", "nurse", "billing", "receptionist"])(
    "denies the %s role before reading or changing consent",
    async (role) => {
      const response = await withdrawConsent(role);

      expect(response.status).toBe(403);
      expect(findConsent).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(getRequestMetadata).not.toHaveBeenCalled();
      expect(createAuditLog).not.toHaveBeenCalled();
    }
  );
});
