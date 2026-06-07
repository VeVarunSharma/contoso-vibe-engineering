import applicationInsights from "applicationinsights";
import type { InvocationContext } from "@azure/functions";

let telemetryClient: applicationInsights.TelemetryClient | undefined;

export function initialiseTelemetry(connectionString?: string): void {
  if (!connectionString || telemetryClient) {
    return;
  }

  applicationInsights.setup(connectionString).setAutoCollectConsole(true, true);
  applicationInsights.defaultClient.setAutoPopulateAzureProperties(true);
  applicationInsights.start();
  telemetryClient = applicationInsights.defaultClient;
}

function stringifyProperties(
  properties?: Record<string, unknown>
): { [key: string]: string } | undefined {
  if (!properties) return undefined;
  const result: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === null) {
      result[key] = String(value);
    } else if (typeof value === "string") {
      result[key] = value;
    } else if (typeof value === "object") {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = String(value);
    }
  }
  return result;
}

export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  telemetryClient?.trackEvent({
    name,
    properties: stringifyProperties(properties),
  });
}

export function trackException(error: Error): void {
  telemetryClient?.trackException({ exception: error });
}

export function logContext(
  context: InvocationContext,
  message: string,
  data?: Record<string, unknown>
): void {
  const payload = data ? `${message} ${JSON.stringify(data)}` : message;
  context.log(payload);
}

