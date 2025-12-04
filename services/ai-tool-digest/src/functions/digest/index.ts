import { app, HttpResponseInit, InvocationContext } from "@azure/functions";
import { z } from "zod";
import { collectUpdates } from "../../scrapers/index.js";
import { buildDigestContent } from "../../summary.js";
import { loadConfig } from "../../config.js";
import {
  initialiseTelemetry,
  logContext,
  trackEvent,
  trackException,
} from "../../logging.js";
import { sendDigestEmail } from "../../email/dispatcher.js";
import type { DigestRequestPayload } from "../../types.js";

const requestSchema = z.object({
  count: z.number().int().min(1).max(20).optional(),
  includeRaw: z.boolean().optional(),
  recipients: z.array(z.string().email()).optional(),
});

async function handler(
  request: Request,
  context: InvocationContext
): Promise<HttpResponseInit> {
  logContext(context, "Digest trigger received");

  try {
    const payload = await parseBody(request);
    const config = loadConfig();

    initialiseTelemetry(config.appInsightsConnectionString);
    trackEvent("digest-start", { count: payload.count });

    const updates = await collectUpdates({
      limitPerSource: payload.count ?? 3,
    });

    if (updates.length === 0) {
      logContext(context, "No updates found", { count: payload.count });
      return {
        status: 204,
        jsonBody: { message: "No updates available" },
      } satisfies HttpResponseInit;
    }

    const digest = buildDigestContent(updates, {
      maxItems: payload.count ?? 9,
      includeRaw: payload.includeRaw ?? false,
    });

    if (payload.recipients && payload.recipients.length > 0) {
      config.recipients = payload.recipients;
    }

    await sendDigestEmail(config, digest);

    logContext(context, "Digest email sent", {
      recipients: config.recipients.length,
    });

    return {
      status: 200,
      jsonBody: {
        message: "Digest email sent",
        recipients: config.recipients,
        updates: updates.length,
      },
    } satisfies HttpResponseInit;
  } catch (error) {
    const serialisableError =
      error instanceof Error ? error : new Error("Unknown digest failure");
    trackException(serialisableError);
    context.error(serialisableError.message);

    return {
      status: 500,
      jsonBody: {
        error: serialisableError.message,
      },
    } satisfies HttpResponseInit;
  }
}

async function parseBody(request: Request): Promise<DigestRequestPayload> {
  if (request.method.toUpperCase() !== "POST") {
    return {};
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid request payload: ${parsed.error.message}`);
  }

  return parsed.data;
}

app.http("digest", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler,
});
