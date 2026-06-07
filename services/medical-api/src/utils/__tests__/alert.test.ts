import { jest } from "@jest/globals";
import { sendSecurityAlert } from "../alert.js";

const originalFetch = globalThis.fetch;
const originalAlertWebhookUrl = process.env.ALERT_WEBHOOK_URL;
const fetchMock = jest.fn<typeof fetch>();

describe("sendSecurityAlert", () => {
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    delete process.env.ALERT_WEBHOOK_URL;
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    if (originalAlertWebhookUrl === undefined) {
      delete process.env.ALERT_WEBHOOK_URL;
    } else {
      process.env.ALERT_WEBHOOK_URL = originalAlertWebhookUrl;
    }

    globalThis.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  it("writes a structured stderr alert and skips fetch when ALERT_WEBHOOK_URL is unset", async () => {
    await sendSecurityAlert({
      type: "phi_in_audit_log",
      severity: "warning",
      message: "Possible PHI detected in audit log fields",
      context: { action: "PATIENT_ACCESS" },
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    const logged = parseLoggedJson(consoleErrorSpy);
    expect(logged).toMatchObject({
      level: "alert",
      type: "phi_in_audit_log",
      severity: "warning",
      message: "Possible PHI detected in audit log fields",
      context: { action: "PATIENT_ACCESS" },
    });
    expect(logged.timestamp).toEqual(expect.any(String));
  });

  it("posts a JSON alert to ALERT_WEBHOOK_URL when configured", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://alerts.example.test/webhook";
    fetchMock.mockResolvedValue(new Response(null, { status: 202 }));

    await sendSecurityAlert({
      type: "phi_in_audit_log",
      severity: "critical",
      message: "Possible PHI detected in audit log fields",
      context: { matchedPattern: "/\\d{10}/" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const requestInit = init as RequestInit;

    expect(url).toBe("https://alerts.example.test/webhook");
    expect(requestInit.method).toBe("POST");
    expect(requestInit.headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(requestInit.signal).toEqual(expect.any(AbortSignal));
    expect(typeof requestInit.body).toBe("string");

    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      source: "medical-api",
      type: "phi_in_audit_log",
      severity: "critical",
      message: "Possible PHI detected in audit log fields",
      context: { matchedPattern: "/\\d{10}/" },
    });
    expect(body.timestamp).toEqual(expect.any(String));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("does not throw and logs a failure when fetch rejects", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://alerts.example.test/webhook";
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(
      sendSecurityAlert({
        type: "phi_in_audit_log",
        severity: "warning",
        message: "Possible PHI detected in audit log fields",
      })
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logged = parseLoggedJson(consoleErrorSpy);
    expect(logged).toMatchObject({
      level: "alert_error",
      message: "Failed to send security alert",
      type: "phi_in_audit_log",
      severity: "warning",
      error: "network down",
    });
  });

  it("does not throw and logs a failure when the webhook returns a non-2xx response", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://alerts.example.test/webhook";
    fetchMock.mockResolvedValue(
      new Response("server error", {
        status: 500,
        statusText: "Internal Server Error",
      })
    );

    await expect(
      sendSecurityAlert({
        type: "phi_in_audit_log",
        severity: "warning",
        message: "Possible PHI detected in audit log fields",
      })
    ).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logged = parseLoggedJson(consoleErrorSpy);
    expect(logged).toMatchObject({
      level: "alert_error",
      message: "Failed to send security alert",
      type: "phi_in_audit_log",
      severity: "warning",
      status: 500,
      statusText: "Internal Server Error",
    });
  });

  it("sends the caller-provided context unchanged so callers must exclude PHI", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://alerts.example.test/webhook";
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await sendSecurityAlert({
      type: "phi_in_audit_log",
      severity: "warning",
      message: "Possible PHI detected in audit log fields",
      context: { patientName: "Alex Smith" },
    });

    const [, init] = fetchMock.mock.calls[0];
    const requestInit = init as RequestInit;
    const body = JSON.parse(String(requestInit.body)) as Record<string, unknown>;

    expect(body.context).toEqual({ patientName: "Alex Smith" });
  });
});

function parseLoggedJson(
  consoleErrorSpy: jest.SpiedFunction<typeof console.error>
): Record<string, unknown> {
  const raw = consoleErrorSpy.mock.calls[0]?.[0];
  expect(typeof raw).toBe("string");
  return JSON.parse(String(raw)) as Record<string, unknown>;
}
