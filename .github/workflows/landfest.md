---
emoji: "🚢"
name: Landfest
description: Marks the current pull request ready when needed and safely lands it in main when invoked with /landfest
on:
  slash_command:
    strategy: centralized
    name: landfest
    events: [pull_request_comment]
permissions:
  contents: read
  pull-requests: read
engine:
  id: copilot
  copilot-sdk: true
max-tool-denials: 3
tools:
  github:
    mode: gh-proxy
    toolsets: [pull_requests, repos]
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
    merge-pr-to-main:
      description: Mark the triggering pull request ready if it is a draft, then squash-merge it into main or enable auto-merge
      runs-on: ubuntu-latest
      inputs:
        pr_number:
          description: The triggering pull request number
          required: true
          type: string
      permissions:
        contents: write
        pull-requests: write
      steps:
        - name: Revalidate and land pull request
          env:
            GH_TOKEN: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
            REPO: ${{ github.repository }}
            EVENT_PR_NUMBER: ${{ github.event.pull_request.number }}
          run: |
            set -euo pipefail

            REQUESTED_PR_NUMBER=$(jq -r '.items[] | select(.type == "merge_pr_to_main") | .pr_number' "$GH_AW_AGENT_OUTPUT")

            if [[ ! "$REQUESTED_PR_NUMBER" =~ ^[0-9]+$ ]]; then
              echo "Invalid pull request number: $REQUESTED_PR_NUMBER" >&2
              exit 1
            fi

            if [[ "$REQUESTED_PR_NUMBER" != "$EVENT_PR_NUMBER" ]]; then
              echo "Refusing to merge PR #$REQUESTED_PR_NUMBER because /landfest was invoked on PR #$EVENT_PR_NUMBER." >&2
              exit 1
            fi

            PR_STATE=$(gh pr view "$EVENT_PR_NUMBER" \
              --repo "$REPO" \
              --json number,state,isDraft,baseRefName,mergeStateStatus,url)

            if ! jq -e '.state == "OPEN"' <<< "$PR_STATE" > /dev/null; then
              echo "PR #$EVENT_PR_NUMBER is not open." >&2
              exit 1
            fi

            if ! jq -e '.baseRefName == "main"' <<< "$PR_STATE" > /dev/null; then
              BASE_BRANCH=$(jq -r '.baseRefName' <<< "$PR_STATE")
              echo "Refusing to merge PR #$EVENT_PR_NUMBER because its base branch is '$BASE_BRANCH', not 'main'." >&2
              exit 1
            fi

            if jq -e '.isDraft == true' <<< "$PR_STATE" > /dev/null; then
              gh pr ready "$EVENT_PR_NUMBER" --repo "$REPO"
            fi

            gh pr merge "$EVENT_PR_NUMBER" \
              --repo "$REPO" \
              --squash \
              --auto \
              --delete-branch
timeout-minutes: 10
strict: true
---

# Landfest - Merge Pull Request into Main

You are the Landfest agent. When an authorized user invokes `/landfest` in a pull request comment, land that exact pull request in `main`.

## Current Context

- **Repository**: ${{ github.repository }}
- **Pull Request Number**: ${{ github.event.pull_request.number }}
- **Triggered by**: @${{ github.actor }}

## Task

1. Use `pull_request_read` with method `get` to inspect pull request `${{ github.event.pull_request.number }}`.
2. Confirm that:
   - The pull request is open.
   - Its base branch is exactly `main`.
   - It has not already been merged.
3. Call `merge_pr_to_main` with `pr_number` set to `${{ github.event.pull_request.number }}`.

The safe-output job independently revalidates the pull request immediately before changing it. If the pull request is a draft, the job marks it ready for review. It then requests a squash merge with auto-merge enabled, so GitHub merges immediately when all repository rules pass or waits for required reviews, checks, and merge-queue conditions.

## Rules

- Process only the pull request where `/landfest` was invoked.
- Never target a different pull request.
- Never merge into a branch other than `main`.
- Never bypass branch protection or use administrator overrides.
- Never force-push or modify the pull request branch.
- Do not merge a closed or already merged pull request.
- Do not attempt to resolve conflicts automatically.
- Call `noop` with a clear reason if validation shows the pull request cannot be processed.

## Result

After calling `merge_pr_to_main`, report whether the pull request:

- Was marked ready for review.
- Was merged immediately.
- Was queued for auto-merge after repository requirements pass.
- Was rejected because validation failed.
