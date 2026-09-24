---
name: Dark Factory Dispatch
description: Dispatches one explicitly queued issue to the Copilot coding agent.
on:
  workflow_dispatch:
  schedule:
    - cron: "*/15 * * * *"
  issues:
    types: [labeled, reopened]
concurrency:
  group: dark-factory-dispatch
  cancel-in-progress: false
permissions:
  copilot-requests: write
  contents: read
  issues: read
strict: true
tools:
  bash: [cat, jq]
steps:
  - name: Select oldest queued factory issue
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      REPO: ${{ github.repository }}
    run: |
      set -euo pipefail
      AGENT_DIR=/tmp/gh-aw/agent
      mkdir -p "$AGENT_DIR"

      gh issue list \
        --repo "$REPO" \
        --state open \
        --label "factory:queued" \
        --limit 100 \
        --json number,title,url,createdAt,labels,assignees \
        > "$AGENT_DIR/queued-issues.json"

      jq '
        [
          .[]
          | select(
              ([.labels[].name] | index("factory:blocked")) == null
              and ([.labels[].name] | index("factory:human-review")) == null
              and ([.assignees[].login | ascii_downcase | contains("copilot")] | any) == false
            )
        ]
        | sort_by(.createdAt, .number)
        | .[0] // {}
      ' "$AGENT_DIR/queued-issues.json" > "$AGENT_DIR/decision-state.json"
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
    dispatch-factory-issue:
      description: Revalidate and assign one queued issue to the Copilot coding agent
      runs-on: ubuntu-latest
      inputs:
        issue_number:
          description: Issue number to dispatch
          required: true
          type: string
      permissions:
        contents: read
        issues: write
      steps:
        - name: Assign Copilot coding agent
          env:
            GH_TOKEN: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
            REPO: ${{ github.repository }}
          run: |
            set -euo pipefail
            ISSUE_NUMBER=$(jq -r '.items[] | select(.type == "dispatch_factory_issue") | .issue_number' "$GH_AW_AGENT_OUTPUT")

            if [[ ! "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
              echo "Invalid issue number: $ISSUE_NUMBER" >&2
              exit 1
            fi

            ISSUE_STATE=$(gh issue view "$ISSUE_NUMBER" \
              --repo "$REPO" \
              --json state,labels,assignees)

            if ! jq -e '
              .state == "OPEN"
              and ([.labels[].name] | index("factory:queued")) != null
              and ([.labels[].name] | index("factory:blocked")) == null
              and ([.labels[].name] | index("factory:human-review")) == null
              and ([.assignees[].login | ascii_downcase | contains("copilot")] | any) == false
            ' <<< "$ISSUE_STATE" > /dev/null; then
              echo "::warning::Issue #$ISSUE_NUMBER is no longer eligible for factory dispatch."
              exit 0
            fi

            for LABEL_SPEC in \
              "factory:queued|0E8A16|Approved work waiting for the dark factory" \
              "factory:building|1D76DB|Work is assigned to the coding agent" \
              "factory:validating|5319E7|Pull request is in automated validation" \
              "factory:human-review|B60205|Automation stopped for human review" \
              "factory:blocked|D93F0B|Automation cannot continue"; do
              IFS='|' read -r NAME COLOR DESCRIPTION <<< "$LABEL_SPEC"
              gh label create "$NAME" \
                --repo "$REPO" \
                --color "$COLOR" \
                --description "$DESCRIPTION" \
                --force
            done

            DEFAULT_BRANCH=$(gh repo view "$REPO" --json defaultBranchRef --jq '.defaultBranchRef.name')

            jq -n \
              --arg target_repo "$REPO" \
              --arg base_branch "$DEFAULT_BRANCH" \
              '{
                assignees: ["copilot-swe-agent[bot]"],
                agent_assignment: {
                  target_repo: $target_repo,
                  base_branch: $base_branch,
                  custom_instructions: "Follow AGENTS.md and repository instructions. Implement only this issue, add or update tests, run the smallest relevant validation, open a draft pull request, and do not merge it."
                }
              }' \
              | gh api \
                  --method POST \
                  "repos/$REPO/issues/$ISSUE_NUMBER/assignees" \
                  --input -

            gh api \
              --method DELETE \
              "repos/$REPO/issues/$ISSUE_NUMBER/labels/factory%3Aqueued" \
              --silent || true

            gh api \
              --method POST \
              "repos/$REPO/issues/$ISSUE_NUMBER/labels" \
              -f 'labels[]=factory:building' \
              --silent

            gh issue comment "$ISSUE_NUMBER" \
              --repo "$REPO" \
              --body "Dark Factory dispatched this issue to the Copilot coding agent. The resulting pull request must pass automated review and CI before native auto-merge is enabled."
timeout-minutes: 10
---

# Dark Factory Dispatch

Process at most one issue per run.

1. Read `/tmp/gh-aw/agent/decision-state.json`.
2. If it contains an issue number, call `dispatch_factory_issue` exactly once with that number.
3. If it is empty, call `noop` because no eligible `factory:queued` issue exists.

`factory:queued` is an explicit maintainer opt-in. Never select an issue without that label, never dispatch a blocked issue, and never dispatch more than one issue per run.
