---
name: Draft PR Auto-Merge
description: Secondary reconciliation path using the same factory assurance and stop gates.
on:
  pull_request_target:
    types: [ready_for_review, labeled, reopened]
  bots: [Copilot, copilot-swe-agent]
if: ${{ github.event.pull_request.draft == false }}
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
  - name: Re-evaluate the triggering factory PR
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      COPILOT_AGENT_TASKS_TOKEN: ${{ secrets.COPILOT_AGENT_TASKS_TOKEN }}
      FACTORY_MODE: ${{ vars.FACTORY_MODE || 'observe' }}
      FACTORY_PR_NUMBER: ${{ github.event.pull_request.number }}
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
    reconcile-triggering-pr:
      description: Revalidate only the triggering PR using shared assurance logic
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
            output-type: reconcile_triggering_pr
          env:
            GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            FACTORY_STATE_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            COPILOT_AGENT_TASKS_TOKEN: ${{ secrets.COPILOT_AGENT_TASKS_TOKEN }}
            PR_MERGE_AUTOMATION_TOKEN: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
            FACTORY_MODE: ${{ vars.FACTORY_MODE || 'observe' }}
            FACTORY_PR_NUMBER: ${{ github.event.pull_request.number }}
timeout-minutes: 20
---

# Secondary factory PR reconciliation

Read `/tmp/gh-aw/agent/decision-state.json`. Call `reconcile_triggering_pr`
once with the exact `selected.key` as `decision_key`, or `noop` when absent.

The trusted controller restricts selection to the triggering PR and rechecks
all ownership, task, review, check, conversation, stop, and exact-head gates.
Stale `automerge` or `factory:merge-ready` labels never bypass these checks.
Do not assign agents, override policy, or schedule follow-up runs.
