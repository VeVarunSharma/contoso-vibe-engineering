---
name: PR Merge Assistant
description: Reviews tracked factory PRs and delegates bounded repair to the dispatcher.
on:
  workflow_dispatch:
  schedule:
    - cron: "4,19,34,49 * * * *"
  pull_request_target:
    types: [ready_for_review, synchronize, reopened, labeled, unlabeled, closed]
concurrency:
  group: dark-factory-mutation
  cancel-in-progress: false
permissions:
  copilot-requests: write
  contents: read
  pull-requests: read
  checks: read
  issues: read
  actions: read
checkout: false
strict: true
tools:
  bash: [cat, jq]
steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
    with:
      ref: main
      persist-credentials: false
  - uses: ./.github/actions/factory-runtime
  - name: Select a verified review or merge transition
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      COPILOT_AGENT_TASKS_TOKEN: ${{ secrets.COPILOT_AGENT_TASKS_TOKEN }}
      FACTORY_MODE: ${{ vars.FACTORY_MODE || 'observe' }}
    run: node .github/scripts/dark-factory/dist/cli.js plan merge --output /tmp/gh-aw/agent/decision-state.json
safe-outputs:
  report-failure-as-issue: false
  report-failed-jobs: false
  noop:
    report-as-issue: false
  missing-data:
    create-issue: false
  missing-tool:
    create-issue: false
  report-incomplete:
    create-issue: false
  jobs:
    reconcile-factory-pr:
      description: Revalidate current-head assurance and perform one review, repair request, or merge
      runs-on: ubuntu-latest
      inputs:
        decision_key:
          description: Exact selected decision key
          required: true
          type: string
      permissions:
        contents: read
        issues: write
        pull-requests: read
        actions: read
        checks: read
      steps:
        - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          with:
            ref: main
            persist-credentials: false
        - uses: ./.github/actions/factory-runtime
        - uses: ./.github/actions/factory-transition
          with:
            lane: merge
            output-type: reconcile_factory_pr
          env:
            GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            FACTORY_STATE_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            COPILOT_AGENT_TASKS_TOKEN: ${{ secrets.COPILOT_AGENT_TASKS_TOKEN }}
            PR_MERGE_AUTOMATION_TOKEN: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
            FACTORY_MODE: ${{ vars.FACTORY_MODE || 'observe' }}
timeout-minutes: 20
---

# PR Merge Assistant

Read `/tmp/gh-aw/agent/decision-state.json`. Call `reconcile_factory_pr` exactly
once with `selected.key` as `decision_key`, or `noop` if no transition is selected.
Never substitute another PR or override the deterministic decision.

Only tracked Copilot PRs from this repository's `copilot/*` branches to `main`
are eligible. Current-head Copilot review, all external checks, resolved
conversations, task completion, and source/PR stop state are revalidated.
Changed paths never introduce human approval. The native squash merge uses
the exact verified head SHA; no bypass flag is permitted.

Repair is a durable request for the dispatcher, not another task launch here.
Never start an agent, reassign Copilot, dispatch follow-up runs, or treat labels
alone as authorization. A paused or stopped item must not retain auto-merge.
