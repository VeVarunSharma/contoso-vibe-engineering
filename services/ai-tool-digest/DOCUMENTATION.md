# AI Tool Digest Service Documentation

This document expands on the README with deeper implementation details, request/response contracts, operational guidance, and extension tips for the Azure Functions service that delivers AI tooling updates to Contoso solution engineers.

---

## 1. Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ HTTP Request │ --> │ Payload/Zod  │ --> │ Scraper      │ --> │ Digest Builder│
│ (GET/POST)   │     │ Validation   │     │ Orchestration│     │ + Email       │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                       ▼
                                                              SMTP (Nodemailer)
                                                                       ▼
                                                              Outlook/Exchange
```

1. **Trigger**: `src/functions/digest/index.ts` exposes an HTTP-triggered Azure Function (`/api/digest`).
2. **Validation**: Requests are parsed and validated with `zod` to ensure shape and email addresses are correct.
3. **Scraping**: `collectUpdates` aggregates source feeds in parallel via RSS (GitHub Copilot changelog, Claude updates, Cursor blog).
4. **Summary**: `buildDigestContent` composes HTML + plaintext TL;DR tailored to solution engineers.
5. **Delivery**: `sendDigestEmail` dispatches mail through SMTP (Nodemailer). Optionally a `DIGEST_TO_OVERRIDE` comma-list can short-circuit to a custom address.
6. **Telemetry**: `logging.ts` wires Application Insights when `DIGEST_APP_INSIGHTS_CONNECTION_STRING` is provided, emitting `digest-start`, `digest-email-sent`, and exception events.

> **Note:** The service is intentionally modular. Adding or removing sources does not require edits to the HTTP handler; simply update the scraper modules and the orchestrator.

---

## 2. HTTP Contract

| Aspect | Details |
| --- | --- |
| **URL** | `https://<function-host>/api/digest` (local: `http://localhost:7071/api/digest`) |
| **Auth Level** | `function` (requires key unless auth downgraded for internal intranet use) |
| **Methods** | `GET` or `POST` |
| **Request Body (POST only)** | JSON object with optional properties:<br/>- `count` *(number)*: 1-20, caps per-source items (default: 3).<br/>- `includeRaw` *(boolean)*: include raw summary paragraphs (default: false).<br/>- `recipients` *(string[])*: override email recipients for this invocation only. |
| **Successful Responses** | `200 OK` with `{ message, recipients[], updates }` when an email is sent.<br/>`204 No Content` when no new updates were found. |
| **Error Responses** | `400/500` JSON with `error` message (validation or runtime failure). |

**Example POST request**

```bash
curl -X POST http://localhost:7071/api/digest \
  -H "Content-Type: application/json" \
  -H "x-functions-key: <function-key>" \
  -d '{
    "count": 5,
    "includeRaw": true,
    "recipients": ["ai-pilot@microsoft.com"]
  }'
```

---

## 3. Configuration & Secrets

All secrets are sourced from environment variables. Use `local.settings.json` for development and App Configuration/Key Vault in production.

| Variable | Purpose |
| --- | --- |
| `AzureWebJobsStorage` | Required by Azure Functions runtime. For local work, the storage emulator (`UseDevelopmentStorage=true`) is fine. |
| `FUNCTIONS_WORKER_RUNTIME` | Should remain `node`. |
| `DIGEST_SMTP_HOST` / `DIGEST_SMTP_PORT` | SMTP relay host and port (587 + STARTTLS recommended). |
| `DIGEST_SMTP_USER` / `DIGEST_SMTP_PASSWORD` | Credentials or app password of the sending account. |
| `DIGEST_FROM_EMAIL` | Display/source email address (e.g. `copilot-digest@contoso.com`). |
| `DIGEST_TO_OVERRIDE` | Optional fallback distribution list for testing or emergency reroutes. |
| `DIGEST_APP_INSIGHTS_CONNECTION_STRING` | Enables Application Insights traces, events, and exceptions. Optional but recommended in production. |

> **Security Tip:** prefer Azure Function App configuration or Key Vault references. Never commit `local.settings.json` – it’s gitignored.

---

## 4. Recipient Management

- Default recipients live in `config/recipients.json` and are combined across teams (duplicates removed).
- Provide `alias`, `displayName`, and `email` per colleague to keep notifications human-readable.
- To test without spamming colleagues, set `DIGEST_TO_OVERRIDE` to your email or supply `recipients` in the request body.
- Use version control for `recipients.json` updates so changes are traceable.

---

## 5. Source Scraper Details

| Source | Module | Feed | Notes |
| --- | --- | --- | --- |
| GitHub Copilot Changelog | `src/scrapers/copilot.ts` | `https://github.blog/changelog/label/copilot/feed/` | Primary driver for Copilot feature updates.
| Claude Code Updates | `src/scrapers/claude.ts` | `https://www.anthropic.com/news/rss.xml` | Filtered by `claude|code|enterprise` keywords to avoid non-dev content.
| Cursor Blog | `src/scrapers/cursor.ts` | `https://cursor.com/blog/rss.xml` | Great for pair-programming features and release notes.

To add a source:
1. Create a new module in `src/scrapers/` that returns `ToolUpdate[]`.
2. Import it in `src/scrapers/index.ts` and merge results into the array.
3. Update `SOURCE_LABELS` in `src/summary.ts` to map the new source to a friendly label.

---

## 6. Email Template & Content Strategy

- Subject format: `Weekly AI Tool Digest (<MMM DD, YYYY>)`.
- HTML body emphasises customer-facing highlights, each with an actionable next step for solution engineers.
- Plain text body mirrors the highlights for clients who disable HTML.
- Enable `includeRaw` for appendix-like raw summaries when deeper context is needed.
- Modify `deriveAction` in `summary.ts` to tweak the coaching statements per source.

---

## 7. Telemetry & Logging

- `logContext(context, message, data?)` writes structured logs to the default Azure Functions log stream.
- `trackEvent` and `trackException` forward metrics and errors to Application Insights when enabled.
- Events emitted:
  - `digest-start` (properties: `count`)
  - `digest-email-sent` (properties: `recipientCount`)
- Exceptions capture both Node errors and custom errors (e.g., SMTP issues, validation failures).
- Consider adding custom dimensions (e.g., update counts per source) if dashboards require finer granularity.

---

## 8. Local Development Workflow

1. `pnpm install` (workspace root).
2. Copy `local.settings.json.example` to `local.settings.json` and populate credentials.
3. `pnpm --filter ai-tool-digest build` to compile TypeScript.
4. `func start --prefix services/ai-tool-digest` to launch the runtime.
5. Hit `http://localhost:7071/api/digest?code=<function-key>` or use the POST example above.
6. Run unit tests with `pnpm --filter ai-tool-digest test` (covers summary formatting and config loading).

> For debugging scrapers without sending email, temporarily set `sendDigestEmail` call under a conditional or point SMTP to [smtp4dev](https://github.com/rnwood/smtp4dev).

---

## 9. Deployment & Scheduling Options

- **Direct Azure Functions Publish**: `func azure functionapp publish <name>` builds, packages, and deploys to the Consumption or Premium plan.
- **Container Deployment**: Use the provided `Dockerfile` to push an image to Azure Container Registry, then deploy via Functions custom container or Azure Container Apps.
- **Scheduling**: If you prefer automatic runs, add a Timer Trigger function or pair the existing HTTP endpoint with Azure Logic Apps / Azure Scheduler to call it daily/weekly.

### Sample Timer Binding (future enhancement)

```json
{
  "authLevel": "function",
  "type": "timerTrigger",
  "direction": "in",
  "name": "digestTimer",
  "schedule": "0 0 14 * * MON"
}
```

> Add the binding above to a new function file to produce a Monday 2 PM UTC cadence.

---

## 10. Troubleshooting Checklist

1. **No email delivered**: Verify SMTP credentials, port, and firewall. Run with `DEBUG=nodemailer` locally for verbose logs.
2. **Validation errors**: Ensure `count` is within 1-20 and `recipients` contains valid emails.
3. **Empty digest**: Confirm feeds are reachable from the hosting environment. Some corporate networks may require an outbound allow-list.
4. **Telemetry missing**: Confirm `DIGEST_APP_INSIGHTS_CONNECTION_STRING` is set and ingestion sampling isn’t filtering events.
5. **Docker build failures**: `pnpm` will install globally in the container if `pnpm-lock.yaml` exists. Clear caches (`docker builder prune`) and retry.

---

## 11. Extensibility Ideas

- Integrate Microsoft Graph to post digest summaries to Teams or Viva Engage.
- Swap SMTP for Azure Communication Services Email (ACS) by adapting `sendDigestEmail`.
- Build a simple persistence layer (PostgreSQL via Drizzle) to deduplicate updates or track click-through metrics.
- Offer per-customer filtering by reading query parameters (e.g., `?source=copilot`).

---

## 12. Reference Links

- [Azure Functions Triggers & Bindings](https://learn.microsoft.com/azure/azure-functions/functions-triggers-bindings?tabs=javascript)
- [Zod Validation Guide](https://zod.dev/)
- [Nodemailer Troubleshooting](https://nodemailer.com/usage/)
- [Application Insights for Node.js](https://learn.microsoft.com/azure/azure-monitor/app/nodejs)

---

For questions or improvements, contact the Contoso Solution Engineering tooling group or open an issue in this repo. Contributions should include unit test updates and a successful `pnpm --filter ai-tool-digest test` run before PR submission.
