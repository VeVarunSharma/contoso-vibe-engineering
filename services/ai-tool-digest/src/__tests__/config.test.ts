import { writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../config.js";

describe("loadConfig", () => {
  const cwd = process.cwd();

  it("loads recipients and merges overrides", () => {
    const tempDir = join(tmpdir(), `digest-test-${Date.now()}`);
    mkdirSync(join(tempDir, "config"), { recursive: true });

    writeFileSync(
      join(tempDir, "config", "recipients.json"),
      JSON.stringify({
        teams: [
          {
            name: "test",
            members: [
              {
                alias: "user",
                displayName: "Test User",
                email: "user@example.com",
              },
            ],
          },
        ],
      }),
      "utf-8"
    );

    process.env.DIGEST_SMTP_HOST = "smtp.example.com";
    process.env.DIGEST_SMTP_PORT = "587";
    process.env.DIGEST_SMTP_USER = "user";
    process.env.DIGEST_SMTP_PASSWORD = "pass";
    process.env.DIGEST_FROM_EMAIL = "digest@example.com";
    process.env.DIGEST_TO_OVERRIDE = "override@example.com";

    const config = loadConfig(tempDir);

    expect(config.recipients).toContain("user@example.com");
    expect(config.recipients).toContain("override@example.com");
    expect(config.smtp.host).toBe("smtp.example.com");
  });

  afterAll(() => {
    process.chdir(cwd);
  });
});
