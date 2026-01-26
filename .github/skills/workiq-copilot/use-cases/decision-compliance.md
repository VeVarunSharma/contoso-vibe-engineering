# Decision Compliance CI Check

This use case demonstrates how to use WorkIQ with GitHub Copilot to validate pull requests against decisions and agreements made in recent team meetings.

## Overview

When a developer opens a PR, this workflow:

1. Extracts feature keywords from the branch name
2. Queries WorkIQ for relevant meeting decisions from the past N days
3. Analyzes the PR diff against those decisions
4. Reports violations, warnings, and compliance evidence
5. Fails CI only on clear violations (not ambiguous warnings)

## Files

| File                                                                                                      | Purpose                 |
| --------------------------------------------------------------------------------------------------------- | ----------------------- |
| [.github/workflows/workiq-decision-compliance.yml](../../../workflows/workiq-decision-compliance.yml)     | GitHub Actions workflow |
| [.github/agents/workiq-decision-compliance.agent.md](../../../agents/workiq-decision-compliance.agent.md) | Copilot agent prompt    |

## Setup

### 1. Repository Secrets

Configure these secrets in your repository settings:

| Secret                 | Required | Description                                              |
| ---------------------- | -------- | -------------------------------------------------------- |
| `COPILOT_GITHUB_TOKEN` | ✅       | Fine-grained PAT with "Copilot Requests" read permission |
| `WORKIQ_TENANT_ID`     | ❌       | Microsoft 365 tenant ID (defaults to 'common')           |

### 2. WorkIQ Admin Consent

First run requires Microsoft 365 admin consent:

- Admin consent URL: https://aka.ms/workiq-admin-consent
- See [Tenant Administrator Enablement Guide](https://docs.microsoft.com/workiq/admin-consent)

### 3. Copilot License

Ensure the PAT owner has an active GitHub Copilot license.

## How It Works

### Trigger Conditions

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:
    inputs:
      lookback_days: "7" # Configurable timeframe
      fail_on_warn: false # Strict mode option
```

### Feature Matching

The workflow extracts keywords from the branch name to find relevant meetings:

| Branch              | Keywords        | Matching Meetings                           |
| ------------------- | --------------- | ------------------------------------------- |
| `feature/user-auth` | "user auth"     | Meetings about authentication, login, OAuth |
| `fix/database-perf` | "database perf" | Meetings about DB optimization, queries     |
| `refactor/api-v2`   | "api v2"        | Meetings about API redesign, versioning     |

### Three-State Outcomes

| Status      | CI Result | When Applied                                         |
| ----------- | --------- | ---------------------------------------------------- |
| ✅ **PASS** | Success   | No violations, code aligns with decisions            |
| ⚠️ **WARN** | Success   | Minor deviations, needs discussion but doesn't block |
| ❌ **FAIL** | Failure   | Clear violations of team agreements                  |

### Violation Types

| Type                    | Severity | Example                                       |
| ----------------------- | -------- | --------------------------------------------- |
| Direct Contradiction    | FAIL     | Team agreed PostgreSQL, PR adds MongoDB       |
| Missing Requirement     | FAIL     | Feature scope agreed but not implemented      |
| Architectural Deviation | FAIL     | Different pattern than agreed                 |
| Naming Mismatch         | WARN     | API endpoints don't follow agreed conventions |
| Unclear Alignment       | WARN     | Can't determine if code matches decision      |

## Example Output

### PR Comment

```
## 📋 Meeting Decision Compliance Report

| Status | Decisions Checked | Violations | Warnings |
|--------|-------------------|------------|----------|
| ⚠️ **WARN** | 3 | 0 | 1 |

### Decisions Analyzed

1. **2026-01-20 Sprint Planning**: Use Zod for all API validation
2. **2026-01-18 Architecture Review**: REST endpoints use noun-based naming
3. **2026-01-15 Tech Sync**: PostgreSQL for all new database features

### Warnings

- **Naming Convention** (2026-01-18): Endpoint `/api/getUsers` uses verb prefix
  - *Recommendation*: Rename to `/api/users` for consistency

### Compliance Evidence

- ✅ Found Zod schemas in `src/validators/`
- ✅ Database queries use PostgreSQL via Drizzle ORM
```

### GitHub Actions Summary

The full report appears in the Actions run summary with the same structured format.

## Configuration Options

### Workflow Dispatch Inputs

Run manually with custom settings:

```bash
gh workflow run workiq-decision-compliance.yml \
  --field lookback_days=14 \
  --field fail_on_warn=true
```

### Environment Variables

| Variable        | Default                          | Description                          |
| --------------- | -------------------------------- | ------------------------------------ |
| `LOOKBACK_DAYS` | 7                                | Days to search for meeting decisions |
| `FAIL_ON_WARN`  | false                            | Treat warnings as failures           |
| `REPORT_PATH`   | `.github/compliance-reports/...` | Report output location               |

## Troubleshooting

### No Report Generated

- **WorkIQ auth failed**: Check `WORKIQ_TENANT_ID` secret and admin consent
- **No meetings found**: Increase `lookback_days` or check keyword matching
- **Copilot CLI error**: Verify `COPILOT_GITHUB_TOKEN` has correct permissions

### False Positives

If the agent incorrectly flags violations:

1. Add context to your PR description about the decision
2. Use `fail_on_warn=false` (default) to not block on uncertain items
3. Improve branch naming to better match meeting topics

### Missing Meetings

WorkIQ queries depend on:

- Correct tenant authentication
- User's access to meeting notes/transcripts
- Keywords matching meeting titles/content

## Future Enhancements

- [ ] Support for linked GitHub Issues as context
- [ ] PR label-based feature matching
- [ ] Caching meeting decisions across PRs
- [ ] Integration with meeting recap summaries
- [ ] Slack/Teams notifications for violations
