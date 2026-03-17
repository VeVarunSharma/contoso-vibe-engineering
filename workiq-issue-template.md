# Feature Request: Service Principal / App-Only (Client Credentials) Authentication for CI/CD and Headless Automation

## Summary

Work IQ currently supports only **OAuth 2.0 delegated permissions** (user-based, interactive sign-in). This makes it impossible to use Work IQ in production CI/CD pipelines, GitHub Actions workflows, or any headless/non-interactive automation scenario without brittle workarounds like pre-seeding refresh tokens on self-hosted runners.

**We are requesting native support for service principal (app-only) authentication** using the OAuth 2.0 client credentials flow, so that Work IQ can be used programmatically in enterprise automation without requiring an interactive user session.

## Motivation & Use Cases

### 1. CI/CD Pipeline Integration (Primary Use Case)

We are building a GitHub Actions workflow that uses the Copilot SDK + WorkIQ MCP server to automatically check pull requests against decisions made in recent team meetings. This workflow:

- Runs on every PR open/sync event on **GitHub-hosted runners** (ephemeral, no persistent state)
- Needs to query meeting transcripts, chat messages, and documents via WorkIQ
- Cannot present a browser or device code prompt — it's fully non-interactive

Today, this workflow **cannot function on GitHub-hosted runners** because WorkIQ requires an interactive OAuth sign-in. The only workaround is a self-hosted runner with a manually pre-authenticated session, which is fragile (tokens expire, MFA re-prompts, no scalability).

### 2. Organization-Level Automation

Enterprises need to run WorkIQ-powered agents at the **organization level** — not tied to a single user's identity. Examples:

- Org-wide compliance bots that scan PRs against meeting decisions
- Scheduled jobs that summarize weekly meeting outcomes into dashboards
- Multi-repo CI checks that reference team agreements from Teams/Outlook

These scenarios require an **app identity** (service principal) that:

- Is not tied to a specific person's mailbox or calendar
- Can be scoped with application permissions granted by a tenant admin
- Survives employee offboarding without breaking automation
- Can authenticate non-interactively via client secret or certificate

### 3. Security & Compliance Benefits

Service principal auth actually improves the security posture:

- **No shared user credentials** in CI secrets (current workaround requires caching a real user's refresh token)
- **Auditable app identity** — actions are attributed to a registered application, not a proxy user
- **Scoped permissions** — tenant admins grant exactly the application permissions needed, no more
- **Certificate-based auth** — eliminates secret rotation issues when using certificates instead of client secrets

## Proposed Solution

### What We're Requesting

Add support for **OAuth 2.0 client credentials flow** (app-only authentication) alongside the existing delegated flow. Specifically:

1. **Register application permissions** in the Work IQ app manifest for the equivalent of the current delegated scopes:

| Current Delegated Scope | Equivalent Application Permission |
|---|---|
| Sites.Read.All | Sites.Read.All (Application) |
| Mail.Read | Mail.Read (Application) |
| People.Read.All | People.Read.All (Application) |
| OnlineMeetingTranscript.Read.All | OnlineMeetingTranscript.Read.All (Application) |
| Chat.Read | Chat.Read.All (Application) |
| ChannelMessage.Read.All | ChannelMessage.Read.All (Application) |
| ExternalItem.Read.All | ExternalItem.Read.All (Application) |

2. **Accept service principal credentials** in the CLI/MCP server configuration:

```bash
# Example: authenticate via environment variables
export WORKIQ_AUTH_MODE=app-only
export WORKIQ_CLIENT_ID=<app-registration-client-id>
export WORKIQ_CLIENT_SECRET=<client-secret-or-cert-path>
export WORKIQ_TENANT_ID=<tenant-id>

npx @microsoft/workiq mcp
```

3. **Support certificate-based authentication** as the recommended production path (more secure than client secrets).

4. **Document the admin consent flow** for application permissions, including PowerShell scripts for enterprise provisioning.

### Suggested Implementation Approach

- Add a new AuthMode enum (`delegated` | `app-only`) to the authentication module
- When `app-only` is selected, use MSAL's `ConfidentialClientApplication` with `acquireTokenByClientCredential()`
- Application permissions don't need user context, so the token acquisition is fully non-interactive
- The existing MCP tool implementations should work unchanged — they already call Microsoft Graph; only the token source changes

## Current Workarounds (All Inadequate)

| Workaround | Why It's Inadequate |
|---|---|
| Self-hosted runner with pre-authenticated WorkIQ session | Token expires; requires manual re-auth; single point of failure; doesn't scale |
| Caching refresh tokens as CI secrets | Security risk; tokens expire per Entra policies; MFA can invalidate at any time |
| Using Microsoft Graph API directly (skip WorkIQ) | Loses WorkIQ's natural language intelligence and meeting-decision extraction capabilities |
| Running WorkIQ only on developer machines | Defeats the purpose of CI/CD automation entirely |

## Environment

- **Work IQ version:** Latest (`@microsoft/workiq` via npm)
- **Integration:** GitHub Actions + GitHub Copilot SDK (`@github/copilot-sdk`)
- **Target:** GitHub-hosted runners (Ubuntu), ephemeral, no persistent state
- **Tenant:** Microsoft 365 with Copilot licenses

## References

- [WorkIQ Authentication Architecture (DeepWiki)](https://deepwiki.com/microsoft/work-iq-mcp/4.2-authentication-and-authorization)
- [WorkIQ Delegated Permissions (DeepWiki)](https://deepwiki.com/microsoft/work-iq-mcp/4.3-delegated-permissions)
- [Admin Consent Instructions](https://github.com/microsoft/work-iq-mcp/blob/main/ADMIN-INSTRUCTIONS.md)
- [Microsoft Graph App-Only Auth](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow)
- [Our CI workflow that needs this](https://github.com/VeVarunSharma/contoso-vibe-engineering/blob/main/.github/workflows/workiq-decision-compliance.yml)

---

We believe this is a critical feature for enterprise adoption of Work IQ. The delegated-only model limits Work IQ to interactive developer tooling. Adding app-only auth would unlock the entire CI/CD and organizational automation space — which is where the real enterprise value lies.

Happy to collaborate on design or testing if this moves forward.
