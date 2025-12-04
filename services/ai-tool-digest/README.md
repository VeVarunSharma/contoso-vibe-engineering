# AI Tool Digest Azure Function

This service scrapes recent updates from GitHub Copilot, Claude Code, and Cursor, then emails a TL;DR digest tailored to Contoso solution engineers.

## Features

- HTTP-triggered Azure Function written in TypeScript
- Modular scrapers for popular AI developer tooling feeds
- Zod-validated environment configuration
- Role-aware summariser producing actionable highlights
- SMTP delivery via Nodemailer with Application Insights telemetry
- Dockerfile for custom container hosting

## Prerequisites

- Node.js 20+
- Azure Functions Core Tools v4 (`npm install -g azure-functions-core-tools@4`)
- Azure Storage emulator or Azure Storage account for `AzureWebJobsStorage`

## Configuration

1. Copy `local.settings.json.example` to `local.settings.json` and update SMTP credentials.
2. Update `config/recipients.json` with colleagues to include on the distribution list.
3. (Optional) Provide an Application Insights connection string via `DIGEST_APP_INSIGHTS_CONNECTION_STRING` for telemetry.

### Required environment values

| Key                                     | Description                                                  |
| --------------------------------------- | ------------------------------------------------------------ |
| `DIGEST_SMTP_HOST`                      | SMTP hostname (e.g. `smtp.office365.com`).                   |
| `DIGEST_SMTP_PORT`                      | SMTP port (e.g. `587`).                                      |
| `DIGEST_SMTP_USER`                      | Username for SMTP auth.                                      |
| `DIGEST_SMTP_PASSWORD`                  | Password or app password for the SMTP account.               |
| `DIGEST_FROM_EMAIL`                     | `From` address for the digest email.                         |
| `DIGEST_TO_OVERRIDE`                    | Optional comma-separated override recipients (w/out spaces). |
| `DIGEST_APP_INSIGHTS_CONNECTION_STRING` | (Optional) Application Insights connection string.           |

## Running locally

```bash
pnpm install
pnpm run build
func start
```

You can also trigger the function manually by issuing an HTTP POST with optional overrides:

```bash
curl -X POST http://localhost:7071/api/digest -H "Content-Type: application/json" -d '{
  "count": 5,
  "includeRaw": false
}'
```

## Docker usage

```bash
docker build -t contoso/ai-tool-digest .
docker run -it --rm -p 7071:80 \
  -e AzureWebJobsStorage="UseDevelopmentStorage=true" \
  -e FUNCTIONS_WORKER_RUNTIME="node" \
  -e DIGEST_SMTP_HOST=... \
  contoso/ai-tool-digest
```

## Tests

```bash
pnpm test
```

## Deployment

- Publish via `func azure functionapp publish <app-name>` or build the Docker image and push to Azure Container Registry.
- Configure settings in Azure Function App Configuration (or container environment).
- Enable Application Insights for first-class telemetry.

## Observability

- Structured logs emitted with metadata for each source.
- Optional Application Insights telemetry for request traces and exceptions.

## Additional resources

- [Full service documentation](./DOCUMENTATION.md)
- [Azure Functions documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Nodemailer SMTP usage](https://nodemailer.com/smtp/)
- [RSS Parser](https://www.npmjs.com/package/rss-parser)
- [Cheerio](https://cheerio.js.org/)
