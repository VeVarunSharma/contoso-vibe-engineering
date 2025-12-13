import applicationInsights from "applicationinsights";
// TODO FIX THIS as InvocationContext type is not being resolved correctly
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

export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  telemetryClient?.trackEvent({ name, properties: properties as any });
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
