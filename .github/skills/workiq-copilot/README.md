# WorkIQ Copilot Skill

This skill enables GitHub Copilot to query Microsoft 365 data via WorkIQ for live organizational context—emails, meetings, documents, Teams messages, and more.

## Contents

- [SKILL.md](SKILL.md) – Core skill instructions for Copilot agents
- [use-cases/](use-cases/) – Practical implementations and examples

## Use Cases

### [Decision Compliance CI Check](use-cases/decision-compliance.md)

**What it does:** A GitHub Actions workflow that validates pull requests against decisions and agreements made in recent team meetings—automatically catching when code contradicts what the team discussed.

**Why it matters:**

| Problem                                                  | Solution                                       |
| -------------------------------------------------------- | ---------------------------------------------- |
| Developers miss context from meetings they didn't attend | WorkIQ queries meeting decisions automatically |
| Architectural decisions get forgotten or ignored         | CI enforces agreed patterns before merge       |
| Code reviews lack visibility into team agreements        | PR comments surface relevant decisions         |
| "I didn't know we decided that" syndrome                 | Proactive compliance checking                  |

**How it works:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Pull Request                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Extract keywords from branch name                           │
│  2. Query WorkIQ for meeting decisions (last N days)            │
│  3. Copilot SDK analyzes PR diff vs decisions                   │
│  4. Generate compliance report                                  │
│  5. Post PR comment with findings                               │
│  6. CI outcome: ✅ PASS / ⚠️ WARN / ❌ FAIL                      │
└─────────────────────────────────────────────────────────────────┘
```

**Key files:**

| File                                                                                                     | Purpose                          |
| -------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [`.github/workflows/workiq-decision-compliance.yml`](../../workflows/workiq-decision-compliance.yml)     | GitHub Actions workflow          |
| [`.github/agents/workiq-decision-compliance.agent.md`](../../agents/workiq-decision-compliance.agent.md) | Copilot agent prompt             |
| [use-cases/decision-compliance.md](use-cases/decision-compliance.md)                                     | Full setup & configuration guide |

**Benefits:**

- **Reduces rework** – Catch violations before code review, not after
- **Preserves institutional knowledge** – Meeting decisions become enforceable
- **Handles ambiguity gracefully** – WARN state for unclear cases (doesn't block)
- **Self-documenting** – PR comments explain which decisions apply and why

## Quick Start

### Prerequisites

1. GitHub Copilot license for the workflow runner
2. Microsoft 365 tenant with WorkIQ admin consent
3. Repository secrets configured:
   - `COPILOT_GITHUB_TOKEN` – Fine-grained PAT with Copilot Requests permission
   - `WORKIQ_TENANT_ID` – Your M365 tenant ID (optional, defaults to 'common')

### Enable the Workflow

The workflow triggers automatically on pull requests. To test manually:

```bash
gh workflow run workiq-decision-compliance.yml \
  --field lookback_days=7 \
  --field fail_on_warn=false
```

### Example Output

When a PR is analyzed, you'll see a comment like:

```
## 📋 Meeting Decision Compliance Report

| Status | Decisions Checked | Violations | Warnings |
|--------|-------------------|------------|----------|
| ⚠️ WARN | 3 | 0 | 1 |

### Warnings
- **Naming Convention** (2026-01-18): Endpoint `/api/getUsers` uses verb prefix
  - Recommendation: Rename to `/api/users` for REST consistency

### Compliance Evidence
- ✅ Found Zod schemas in src/validators/
- ✅ Database uses PostgreSQL via Drizzle ORM
```

## Configuration

| Setting         | Default | Description                          |
| --------------- | ------- | ------------------------------------ |
| `lookback_days` | 7       | Days to search for meeting decisions |
| `fail_on_warn`  | false   | Treat warnings as CI failures        |

## Future Use Cases

- [ ] Sprint planning alignment checker
- [ ] Architecture decision record (ADR) validation
- [ ] Stakeholder notification for sensitive changes
- [ ] Automated meeting summary to PR linking

## Related Resources

- [WorkIQ Documentation](https://aka.ms/workiq)
- [Copilot SDK Reference](https://docs.github.com/copilot/sdk)
- [MCP Server Guide](../mcp-builder/SKILL.md)
