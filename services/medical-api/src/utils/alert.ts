export interface SecurityAlertPayload {
  type: string;
  severity: "warning" | "critical";
  message: string;
  context?: Record<string, unknown>;
}

const ALERT_TIMEOUT_MS = 5000;

/**
 * Sends a security alert without blocking the request path.
 *
 * PIPA BC safeguard: alert payloads must contain metadata only. Callers must
 * never pass PHI values in `context`; use field names, matched patterns, action
 * names, resource types, and other non-PHI metadata instead.
 */
export async function sendSecurityAlert(
  payload: SecurityAlertPayload
): Promise<void> {
  const timestamp = new Date().toISOString();
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;

  if (!webhookUrl) {
    logToStderr({
      timestamp,
      level: "alert",
      ...payload,
    });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ALERT_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timestamp,
        source: "medical-api",
        ...payload,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logAlertFailure({
        timestamp: new Date().toISOString(),
        type: payload.type,
        severity: payload.severity,
        status: response.status,
        statusText: response.statusText,
      });
    }
  } catch (error: unknown) {
    logAlertFailure({
      timestamp: new Date().toISOString(),
      type: payload.type,
      severity: payload.severity,
      error: getErrorMessage(error),
    });
  } finally {
    clearTimeout(timeout);
  }
}

function logAlertFailure(details: Record<string, unknown>): void {
  logToStderr({
    level: "alert_error",
    message: "Failed to send security alert",
    ...details,
  });
}

function logToStderr(entry: Record<string, unknown>): void {
  console.error(JSON.stringify(entry));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
