import { getPublishingAvailability } from "@/lib/support-config";

describe("getPublishingAvailability", () => {
  const original = process.env;

  beforeEach(() => {
    process.env = {
      ...original,
      GITHUB_TOKEN: "test-only",
      GITHUB_OWNER: "example",
      GITHUB_REPO: "support",
      USE_COPILOT_SDK: "false",
    };
    delete process.env.SUPPORT_MODE;
  });

  afterEach(() => {
    process.env = original;
  });

  it("defaults to preview even if credentials exist", () => {
    expect(getPublishingAvailability()).toEqual({ mode: "preview" });
  });

  it("does not serialize credentials to the page", () => {
    process.env.SUPPORT_MODE = "live";
    expect(getPublishingAvailability()).toEqual({
      mode: "direct",
      repository: "example/support",
    });
    expect(JSON.stringify(getPublishingAvailability())).not.toContain(
      "test-only",
    );
  });

  it("reports missing configuration without falling back to live publishing", () => {
    process.env.SUPPORT_MODE = "live";
    delete process.env.GITHUB_TOKEN;
    expect(getPublishingAvailability()).toMatchObject({
      mode: "unavailable",
      reason: expect.stringContaining("GITHUB_TOKEN"),
    });
  });

  it("fails closed on an invalid mode", () => {
    process.env.SUPPORT_MODE = "typo";
    expect(getPublishingAvailability()).toMatchObject({ mode: "unavailable" });
  });

  it("fails closed on an invalid AI mode", () => {
    process.env.SUPPORT_MODE = "live";
    process.env.USE_COPILOT_SDK = "yes";
    expect(getPublishingAvailability()).toMatchObject({
      mode: "unavailable",
      reason: expect.stringContaining("USE_COPILOT_SDK"),
    });
  });

  it("rejects repository URLs rather than concatenating them into API paths", () => {
    process.env.SUPPORT_MODE = "live";
    process.env.GITHUB_REPO = "https://github.com/example/support";
    expect(getPublishingAvailability()).toMatchObject({
      mode: "unavailable",
      reason: expect.stringContaining("not URLs"),
    });
  });
});
