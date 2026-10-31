# Dark Factory Operations

The factory admits actionable issues, tracks Copilot tasks, repairs failures,
and enables guarded native squash merges. GitHub issues, PRs, task IDs, and
bot-owned state comments are the durable record. The default is **observe**:
installing these workflows does not activate autonomous backlog intake.

See [the architecture](dark-factory-architecture.md) for ownership and assurance
boundaries. This pipeline's delivery boundary is a verified merge and source
issue reconciliation, not a claim that production deployment succeeded.

## Prerequisites

- GitHub Actions and Copilot cloud agent are enabled; the default branch is `main`.
- The account can start tasks through the public-preview
  [Agent Tasks API](https://docs.github.com/en/rest/agent-tasks/agent-tasks).
  Successful reads do not establish task-creation eligibility.
- `COPILOT_AGENT_TASKS_TOKEN` is a supported **user** token with repository
  **Agent tasks: read and write**. Installation tokens are not supported by
  this API. Do not put credentials in files or workflow inputs.
- `PR_MERGE_AUTOMATION_TOKEN` can read PRs/checks, request Copilot reviews,
  change readiness, rerun failed Actions jobs, and enable/disable native
  auto-merge. Task creation no longer uses Copilot assignee toggling.
- `GITHUB_TOKEN` writes labels and state comments in privileged jobs.
  `FACTORY_STATE_TOKEN` is a step-local alias for that token, not another secret.
- Native auto-merge and squash merging are enabled. Protect `main` with a PR
  ruleset and resolved-conversation requirements; require consistently reported
  external CI checks before treating this as production assurance.
- Use GH-AW **v0.89.21**, matching the compiler pinned by factory CI, and include
  regenerated lockfiles with source changes.

Existing secrets are reused, but an operator must explicitly provide any
missing permissions. No workflow grants itself access or bypasses branch rules.

## Modes and rollout

The repository Actions variable `FACTORY_MODE` controls the loop:

| Value              | Behavior                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unset or `observe` | Report automatic admission/recovery decisions without applying them. Current, explicitly maintainer-queued work and its tracked descendants can still proceed. |
| `live`             | Admit policy-qualified backlog and verified incidents, then run bounded execution and recovery.                                                                |
| `paused`           | Do not start work or change readiness. Reconcile disabling pending auto-merge on owned PRs. Existing agents are not automatically cancelled.                   |

Start with local tests and report-only assessment. Install the implementation on
`main` through the normal PR process. Confirm the task API/account prerequisites,
then enable `live` as a separate, deliberate operator action:

```powershell
# These commands change the operating mode; do not run as a diagnostic probe.
gh variable set FACTORY_MODE --body live
gh variable set FACTORY_MODE --body paused
gh variable set FACTORY_MODE --body observe
```

Each workflow receives a mode snapshot. A mode change or issue label is not an
instantaneous cancellation of a running job, agent, or native auto-merge request.
For an emergency, pause, apply `factory:human-review`, explicitly disable any
already-pending auto-merge, and inspect in-flight tasks.

## What enters the factory

Automatic admission accepts maintainer-authored, scoped issues and canonical
automation incidents verified against their actual Actions run, attempt, job,
step, and failure annotations. External issues require explicit maintainer
enrollment. A matching title, label, or embedded marker alone is insufficient.

Features need concrete acceptance criteria; bugs can instead provide concrete
reproduction steps and expected behavior. Template placeholders, epics, research
requests, and ambiguous dependencies receive `factory:needs-scope`, not invented
requirements or decomposition tickets. The classifier is deliberately
conservative and structural; it does not claim to understand arbitrary prose.

Native blocking relationships and explicit `Blocked by:`, `Depends on:`, and
`Dependencies:` sections are respected. `Parent:` does not imply a prerequisite.
Cycles, missing references, and unsupported cross-repository prerequisites are
held with a reason. Human-only assignments, Squad-owned work, unverified existing
PRs, and duplicates are not taken over. Dependabot and direct security-alert
intake are out of scope.

A maintainer can still enroll a focused issue with `factory:queued`. Its
eligibility, scope, dependencies, ownership, and stop state are rechecked at
dispatch. Removing the queue label is not a permanent opt-out; use the stop label.

## Execution and recovery

There are **three in-flight work slots**, with one selected transition per run.
An issue, its task, and its PR consume one slot, including review and CI waiting.
The dispatcher is the only owner of task starts and retries.

Every task starts with a persisted attempt intent and correlation key. The
returned task ID is saved before success is reported. A lost response or failed
bookkeeping write keeps the reservation; later reconciliation searches the exact
correlation marker. It never blindly resubmits a task POST.

Each item has one initial attempt and **at most five recovery attempts**.
Failures, repeated lost-review requests, and infrastructure reruns share this
budget. Observations and ordinary first reviews do not spend it. Backoff starts
at 15 minutes and doubles up to eight hours; it is based on durable state, not a
runner sleeping. Repeated events do not reset attempts.

| Condition                                                 | Response                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Task queued/running                                       | Wait; no competing task                                                               |
| Completed task with matching PR/branch                    | Mark ready and apply `factory:validating`; older work has no arbitrary date cutoff    |
| Failed/timed-out task                                     | Retry within budget, using the existing PR branch when one is verified                |
| Failed CI, conflict, requested changes, unresolved thread | Record a repair request; dispatcher creates the repair task                           |
| Missing artifact                                          | Wait for propagation, then reconcile; an existing unmatched PR prevents a replacement |
| Cancelled task or manually closed unmerged PR             | Block rather than recreate work                                                       |
| Idle/waiting-for-user task                                | Hold with the blocker; do not fabricate an answer                                     |
| Ambiguous request outcome                                 | Retain the reservation and reconcile positive evidence; never guess it failed         |
| Five recoveries exhausted                                 | Mark `factory:blocked`; continue other work where capacity is available               |
| Credential rejection                                      | Open a controller launch circuit; do not consume every issue's budget                 |

Infra failures are not automatically code bugs. A retry must still target the
current trusted workflow revision. An incident is resolved only after its
previously failing job **and step** execute successfully, not because another
run is green or the failing step was skipped. Historical incidents with missing
or unverifiable evidence remain visible and are not automatically repaired.
A failure on an older revision without later recovery proof is held for current
evidence rather than becoming a new code-repair task.

### Resetting blocked work

Inspect the durable record and fix the reported cause first. A maintainer can
explicitly reset a terminal blocked item:

```powershell
gh workflow run complete-copilot-prs.yml -f reset_issue=123
```

The reset verifies the actor's current repository permission, refuses ambiguous
or active attempts and closed PRs, and preserves previous attempts in history.
It does not remove a manual emergency stop. Merely deleting a blocked label or
editing an automation comment is not a supported reset.

## PR assurance

The completion and merge paths require tracked source ownership, the immutable
Copilot author identity, this repository's `copilot/*` branch to `main`, and the
latest matching completed task. A newer task on that branch blocks stale
completion evidence.

Copilot review must name the **current commit SHA**. Review timestamps alone are
not sufficient. At least one external check must exist, all external check runs
must finish with `success`, `neutral`, or `skipped`, and all status contexts must
be `success`. Unresolved conversations and requested changes block merging.

Known controller workflows are excluded by both name and workflow path.
**Dark Factory Tests is external assurance and is never excluded.** Primary and
secondary merge paths use the same checks and stop controls. Native auto-merge
is requested with `--match-head-commit`; no bypass option is used. GitHub branch
rules remain the server-side protection if the PR changes after that request.

There is no changed-path human approval lane. Workflow, infrastructure, security,
and schema changes use these same gates. `factory:human-review` is an explicit
manual stop, not an automatic classification.

## State labels and evidence

| Label                              | Meaning                                               |
| ---------------------------------- | ----------------------------------------------------- |
| `factory:queued`                   | Authorized for dispatch                               |
| `factory:building`                 | A factory execution record exists                     |
| `factory:validating`               | Latest tracked task completion verified on the PR     |
| `factory:repair-requested`         | Dispatcher must reconcile a repair                    |
| `factory:needs-scope`              | Missing scope or unsupported/ambiguous evidence       |
| `factory:blocked`                  | Work cannot safely continue; inspect the state record |
| `factory:human-review`             | Manual emergency stop on issue or PR                  |
| `factory:merge-ready`, `automerge` | Current automated merge gates passed                  |

Versioned bot-owned comments retain admission, execution attempts, completion,
and review requests. Malformed, forged, or duplicate state fails closed.
Labels are a view of this state, not sole authorization. A verified merged PR
closes its source issue and releases the slot; a successful workflow alone does
neither.

## Development and diagnostics

```powershell
pnpm --filter @workspace/dark-factory test --runInBand
pnpm --filter @workspace/dark-factory typecheck
pnpm --filter @workspace/dark-factory lint
pnpm --filter @workspace/dark-factory build

# Read-only; no labels, tasks, reruns, readiness changes, or merges.
$env:GH_TOKEN = gh auth token
pnpm --filter @workspace/dark-factory plan intake --repo VeVarunSharma/contoso-vibe-engineering
pnpm --filter @workspace/dark-factory plan --repo VeVarunSharma/contoso-vibe-engineering

gh aw compile dark-factory-intake dark-factory-dispatch pr-merge-assistant draft-pr-automerge --approve --actionlint --validate
gh aw status
```

Use `--output <path>` to save a read-only assessment. The root repository has no
`pnpm test` script; the focused command above is the factory suite. Never edit
generated `.lock.yml` files directly.

Run summaries distinguish no work, dependency waits, capacity, missing scope,
recovery, and degraded evidence. The incident reporter deduplicates failures and
limits repeated comments; its scheduled backstop samples recent unreported
failures, including its own, without recursive workflow dispatch.

After authorized live activation, verify one issue through intake, task, PR,
current-head review/checks, actual merge, and issue closure. Record those IDs and
the merge SHA. Do not claim the factory is operational merely because scheduled
runs are green.
