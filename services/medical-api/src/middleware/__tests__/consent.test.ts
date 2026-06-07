import { jest } from "@jest/globals";

const findFirst = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule("../../db/index.js", () => ({
  db: {
    query: {
      consentRecords: {
        findFirst,
      },
    },
  },
}));

const { verifyConsent } = await import("../consent.js");

describe("verifyConsent", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("permits emergency access without consulting the DB", async () => {
    const result = await verifyConsent("p-1", "emergency", "user-1");
    expect(result.valid).toBe(true);
    expect(result.reason).toMatch(/Emergency access permitted/);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("rejects when no active consent exists", async () => {
    findFirst.mockResolvedValueOnce(undefined);

    const result = await verifyConsent("p-1", "treatment", "user-1");
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/No active consent/);
  });

  it("rejects when consent has been withdrawn", async () => {
    findFirst.mockResolvedValueOnce({
      id: "c-1",
      withdrawnAt: new Date("2024-01-01"),
      expiresAt: null,
    });

    const result = await verifyConsent("p-1", "treatment", "user-1");
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/withdrawn/i);
  });

  it("rejects when consent has expired", async () => {
    findFirst.mockResolvedValueOnce({
      id: "c-1",
      withdrawnAt: null,
      expiresAt: new Date("2000-01-01"),
    });

    const result = await verifyConsent("p-1", "treatment", "user-1");
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/expired/i);
  });

  it("returns valid + consentId + expiresAt when consent is active and unexpired", async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    findFirst.mockResolvedValueOnce({
      id: "c-1",
      withdrawnAt: null,
      expiresAt: future,
    });

    const result = await verifyConsent("p-1", "treatment", "user-1");
    expect(result.valid).toBe(true);
    expect(result.consentId).toBe("c-1");
    expect(result.expiresAt).toEqual(future);
  });

  it("returns valid with no expiresAt when consent has none", async () => {
    findFirst.mockResolvedValueOnce({
      id: "c-2",
      withdrawnAt: null,
      expiresAt: null,
    });

    const result = await verifyConsent("p-1", "billing", "user-1");
    expect(result.valid).toBe(true);
    expect(result.consentId).toBe("c-2");
    expect(result.expiresAt).toBeUndefined();
  });
});
