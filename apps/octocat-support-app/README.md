# Octocat Support

A support analyst turns a customer report into a structured, reviewable engineering handoff. Rehearse with synthetic data and download real Markdown; optionally publish to GitHub after explicit approval.

![The running application reviewing a synthetic order-search report, its suggested labels, and the rules behind those labels](../../docs/images/support-review.png)

_Template preview from the actual application. No model call, order-system lookup, or GitHub issue creation is represented by this screenshot._

## Run locally

Use Node.js 20+ and pnpm 10.26.2. From the **monorepo root**:

```powershell
pnpm install --frozen-lockfile --filter octocat-support-app...
$env:SUPPORT_MODE = "preview"
$env:NEXT_TELEMETRY_DISABLED = "1"
pnpm --filter octocat-support-app dev
```

Open **http://127.0.0.1:3002**. Choose **Use sample report -> Review issue draft -> Download handoff**. Open `support-handoff.md` to inspect the report, suggested labels, provenance, and review checklist. Editing preserves the source report; starting another report clears only browser memory.

No `.env.local`, database, Copilot account, or GitHub token is needed. The preview uses the same deterministic builder as direct live publishing, not prerecorded success output. Fonts use the local system stack.

**[Presenter walkthrough and recovery](../../docs/support-demo.md)** · **[Adaptation points](../../docs/support-demo.md#adapt-it)** · **[Repository overview](../../README.md)**

## Modes and configuration

Preview stays available in every mode. Live configuration never changes a preview into an external request.

| Configuration                                          | Behavior                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPPORT_MODE=preview` (default)                       | Template draft and local Markdown export. The publishing endpoint returns 403, even if credentials exist.                                        |
| `SUPPORT_MODE=live`, `USE_COPILOT_SDK=false` (default) | Optional confirmed publishing through the GitHub REST API. Uses the reviewed template's title, body, and labels.                                 |
| `SUPPORT_MODE=live`, `USE_COPILOT_SDK=true`            | Optional confirmed live AI triage and issue creation. AI may change the template draft; inspect the returned issue. No silent template fallback. |

For live mode, use a private local configuration based on [`.env.local.example`](.env.local.example). Supply `GITHUB_OWNER`, `GITHUB_REPO`, and `GITHUB_TOKEN`. Prefer a fine-grained PAT restricted to a dedicated test repository with **Issues: read/write**; verify it can apply the existing labels. Never commit credentials. Invalid or missing configuration disables publishing with an actionable message. Restart after configuration changes.

AI mode additionally needs an installed, authenticated Copilot CLI and access to the model configured in [`lib/copilot-triage.ts`](lib/copilot-triage.ts), currently `gpt-4o`. Model availability and usage costs depend on the account. The SDK remains a preview dependency. The application permits one issue-creation attempt per SDK session; it does not deduplicate separate requests.

## API and extension points

Both endpoints validate with Zod. Error responses are `{ success: false, error: string }`.

| Endpoint                    | Contract                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/tickets/preview` | Report fields from [`lib/types.ts`](lib/types.ts). Returns 200 with `mode: "template-preview"` and `{ title, body, labels }` under `draft`; never returns a fabricated issue URL/number. |
| `POST /api/tickets`         | Same report fields **plus `confirmSubmission: true`**. Requires live mode. Returns 201 with the GitHub-confirmed issue URL, number, title, and labels.                                   |

Malformed/invalid input returns 400; disabled publishing or a security report returns 403; missing live configuration returns 503; integration failures return 502. Unexpected internal failures return 500. After an ambiguous live failure, check the repository before retrying.

**Compatibility change:** existing publishing callers must explicitly enable live mode and send confirmation. Security reports are export-only. AI failures no longer silently use direct triage.

The Server Component reads publishing availability without exposing credentials. [`ticket-form.tsx`](components/ticket-form.tsx) handles intake; [`ticket-review.tsx`](components/ticket-review.tsx) handles review/export/consent. [`ticket-draft.ts`](lib/ticket-draft.ts) owns reusable templates and label rules; [`prompts.ts`](lib/prompts.ts) owns optional AI guidance. Both reuse `@workspace/ui`.

## Validate

From the monorepo root:

```powershell
pnpm --filter octocat-support-app test:ci
pnpm --filter octocat-support-app lint
pnpm --filter octocat-support-app typecheck
pnpm --filter octocat-support-app build
```

Jest/SWC covers components, input validation, preview, publishing gates, and mocked integration failures. [Browser checks and screenshot reproduction](../../docs/support-demo.md#reproduce-and-validate) exercise the real local workflow and verify the downloaded bytes.

## Boundaries

Use synthetic or approved data. Reporter details are included in downloads and any explicitly published issue; repository visibility determines who can read them. Security concerns must go through an approved private channel, never this portal's publishing endpoint.

This is not an official GitHub support channel or a production help desk. There is no portal authentication, rate limiting, persistence, automatic assignment, SLA engine, or cross-request deduplication. Keep it on loopback; assess access, retention, abuse controls, and approval policy before external use. A template draft is not an independently verified recommendation. Live GitHub/Copilot execution requires separate authorization and is not demonstrated by the local screenshots.

## License

MIT
