import { defineConfig } from "@playwright/test";
import { z } from "zod";

const port = z.coerce
  .number()
  .int()
  .min(1024)
  .max(65535)
  .parse(process.env.SUPPORT_DEMO_PORT ?? 3102);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  retries: 0,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      SUPPORT_MODE: "preview",
      USE_COPILOT_SDK: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
