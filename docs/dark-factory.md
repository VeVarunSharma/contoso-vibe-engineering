# Dark Factory Operations

> **Authoritative reference:** [Dark Factory Enterprise Architecture](dark-factory-architecture.md) documents the live control plane, trust model, workflow triggers, state machine, deterministic merge gates, ruleset, repair behavior, credentials, audit evidence, and verified #465/#466 autonomous merge.

Use this page as the concise operator entry point. The dark factory is an explicit opt-in for low-risk work: create a focused issue, add testable acceptance criteria, confirm the change is outside the high-risk path boundary, and apply `factory:queued`.

## Operator checklist

1. Confirm GitHub Actions, Copilot coding agent, native auto-merge, and squash merging are enabled.
2. Confirm `COPILOT_AGENT_TASKS_TOKEN` and `PR_MERGE_AUTOMATION_TOKEN` are configured with only the permissions described in the [architecture guide](dark-factory-architecture.md#tokens-secrets-and-least-privilege).
3. Confirm the active `Dark factory main guardrails` ruleset targets `main`.
4. Confirm the issue is focused, testable, low risk, and not labeled `factory:blocked` or `factory:human-review`.
5. Apply `factory:queued`; do not manually add `automerge` or `factory:merge-ready`.

## Common commands

```powershell
gh aw status

# Compile only after editing agentic Markdown sources
gh aw compile dark-factory-dispatch pr-merge-assistant draft-pr-automerge --approve --actionlint --validate

# Start bounded reconciliation
gh aw run dark-factory-dispatch
gh workflow run complete-copilot-prs.yml
gh aw run pr-merge-assistant

# Inspect state
gh issue list --label "factory:queued" --state open
gh pr list --label "factory:validating" --state open
gh run list --workflow pr-merge-assistant.lock.yml --limit 20
```

Do not edit generated `.lock.yml` files directly. Update the matching Markdown source, compile it, and review both source and generated changes. Follow the [troubleshooting sequence](dark-factory-architecture.md#operations-and-troubleshooting) before changing labels or rerunning workflows.
