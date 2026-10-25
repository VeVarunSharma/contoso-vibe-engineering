import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SAMPLE_TICKET } from "../lib/sample-ticket";
import { buildIssueDraft, formatDraftMarkdown } from "../lib/ticket-draft";

async function capture(page: Page, name: string, testInfo: TestInfo) {
  if (process.env.UPDATE_DEMO_SCREENSHOTS !== "1") return;
  if (testInfo.project.name === "mobile" && name !== "intake") return;
  const filename =
    testInfo.project.name === "mobile"
      ? "support-mobile.png"
      : `support-${name}.png`;
  await page.screenshot({
    path: path.resolve(__dirname, "..", "..", "..", "docs", "images", filename),
    fullPage: true,
    animations: "disabled",
  });
}

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(
    (theme) => localStorage.setItem("theme", theme),
    testInfo.project.name === "mobile" ? "light" : "dark",
  );
});

test("report -> reviewed draft -> real downloadable handoff, with no external requests", async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (
      !request.url().startsWith("blob:") &&
      new URL(request.url()).origin !== testInfo.project.use.baseURL
    ) {
      externalRequests.push(request.url());
    }
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Turn a support report into an engineering handoff",
  );
  await expect(
    page.getByRole("button", { name: "Review issue draft" }),
  ).toBeVisible();
  const sampleButton = await page
    .getByRole("button", { name: "Use sample report" })
    .boundingBox();
  expect(sampleButton).not.toBeNull();
  expect(
    (sampleButton?.y ?? Infinity) + (sampleButton?.height ?? 0),
  ).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await capture(page, "intake", testInfo);

  await page.getByRole("button", { name: "Use sample report" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Description and evidence")).toHaveValue(
    SAMPLE_TICKET.description,
  );
  await page.getByRole("button", { name: "Review issue draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Review the issue draft" }),
  ).toBeFocused();
  await expect(page.getByLabel("Issue body", { exact: true })).toContainText(
    "DEMO-1042",
  );
  await expect(
    page.getByRole("region", { name: "Issue summary" }),
  ).toContainText("priority:high");
  await expect(
    page.getByRole("button", { name: "Create GitHub issue" }),
  ).toHaveCount(0);
  await expect(page.locator('[aria-current="step"]')).toContainText("Review");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await capture(page, "review", testInfo);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download handoff" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("support-handoff.md");
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  if (!downloadPath) throw new Error("The browser did not produce a download");
  expect(await readFile(downloadPath, "utf8")).toBe(
    formatDraftMarkdown(buildIssueDraft(SAMPLE_TICKET)),
  );
  await expect(
    page.getByRole("heading", { name: "Your handoff is ready" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Nothing was sent to GitHub",
  );
  await expect(page.locator('[aria-current="step"]')).toContainText("Handoff");
  await capture(page, "handoff", testInfo);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(pageErrors).toEqual([]);
  expect(externalRequests).toEqual([]);

  await page.getByRole("button", { name: "Start another report" }).click();
  await expect(page.getByLabel("Subject", { exact: true })).toHaveValue("");
});

test("invalid input is recoverable and the live endpoint is disabled", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Review issue draft" }).click();
  await expect(page.getByLabel("Reporter name")).toBeFocused();
  await expect(page.getByLabel("Reporter name")).toHaveAttribute(
    "aria-describedby",
    "name-error",
  );
  await page.getByRole("button", { name: "Use sample report" }).click();
  await expect(page.getByLabel("Reporter name")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  const publish = await request.post("/api/tickets", {
    data: { ...SAMPLE_TICKET, confirmSubmission: true },
  });
  expect(publish.status()).toBe(403);
  expect(await publish.json()).toMatchObject({
    success: false,
    error: expect.stringContaining("disabled in preview mode"),
  });
  const malformed = await request.post("/api/tickets/preview", {
    data: "{",
    headers: { "Content-Type": "application/json" },
  });
  expect(malformed.status()).toBe(400);
});

test("a failed preview retains input and allows a deliberate retry", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Use sample report" }).click();
  await page.route("**/api/tickets/preview", (route) => route.abort());
  await page.getByRole("button", { name: "Review issue draft" }).click();
  await expect(
    page.getByRole("alert", { name: "Preview error" }),
  ).toContainText("Your report has not been cleared");
  const contrast = await page
    .getByRole("alert", { name: "Preview error" })
    .evaluate((alert) => {
      const description = alert.querySelector(
        '[data-slot="alert-description"]',
      );
      if (!description) throw new Error("Missing error description");
      const context = document.createElement("canvas").getContext("2d");
      if (!context) throw new Error("Cannot measure rendered colors");
      const background = getComputedStyle(alert).backgroundColor;
      function luminance(foreground: string) {
        if (!context) throw new Error("Missing canvas context");
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = background;
        context.fillRect(0, 0, 1, 1);
        context.fillStyle = foreground;
        context.fillRect(0, 0, 1, 1);
        const channels = Array.from(context.getImageData(0, 0, 1, 1).data)
          .slice(0, 3)
          .map((channel) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
        return (
          (channels[0] ?? 0) * 0.2126 +
          (channels[1] ?? 0) * 0.7152 +
          (channels[2] ?? 0) * 0.0722
        );
      }
      const text = luminance(getComputedStyle(description).color);
      const surface = luminance(background);
      return (
        (Math.max(text, surface) + 0.05) / (Math.min(text, surface) + 0.05)
      );
    });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  await expect(page.getByLabel("Description and evidence")).toHaveValue(
    SAMPLE_TICKET.description,
  );
  await page.unroute("**/api/tickets/preview");
  await page.getByRole("button", { name: "Review issue draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Review the issue draft" }),
  ).toBeVisible();
});
