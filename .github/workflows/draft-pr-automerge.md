---
name: Draft PR Auto-Merge
description: Enables native auto-merge for opted-in draft pull requests after they are marked ready.
on:
  pull_request_target:
    types: [ready_for_review, labeled, reopened]
  bots: [Copilot, copilot-swe-agent]
concurrency:
  group: draft-pr-automerge-${{ github.event.pull_request.number }}
  cancel-in-progress: true
permissions:
  copilot-requests: write
  contents: read
  pull-requests: read
if: ${{ github.event.pull_request.draft == false }}
checkout: false
strict: true
tools:
  bash: [cat, jq]
steps:
  - name: Capture trusted pull request state
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      REPO: ${{ github.repository }}
      PR_NUMBER: ${{ github.event.pull_request.number }}
    run: |
      set -euo pipefail
      AGENT_DIR=/tmp/gh-aw/agent
      mkdir -p "$AGENT_DIR"

      if [[ ! "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
        echo "Invalid pull request number: $PR_NUMBER" >&2
        exit 1
      fi

      gh pr view "$PR_NUMBER" \
        --repo "$REPO" \
        --json number,title,url,state,isDraft,headRefOid,baseRefName,author,labels \
        > "$AGENT_DIR/pr-state.json"

      jq '{
        pull_request_number: .number,
        title,
        url,
        state,
        is_draft: .isDraft,
        head_sha: .headRefOid,
        base_branch: .baseRefName,
        author: .author.login,
        labels: [.labels[].name],
        eligible: (
          .state == "OPEN"
          and .isDraft == false
          and any(.labels[]; .name == "automerge")
          and any(.labels[]; .name == "factory:merge-ready")
        ),
        reason: (
          if .state != "OPEN" then "Pull request is not open."
          elif .isDraft then "Pull request is still a draft."
          elif (any(.labels[]; .name == "automerge") | not) then "The automerge label is not present."
          elif (any(.labels[]; .name == "factory:merge-ready") | not) then "The factory merge gates have not passed."
          else "Pull request is ready and explicitly opted in to auto-merge."
          end
        )
      }' "$AGENT_DIR/pr-state.json" > "$AGENT_DIR/decision-state.json"
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
    enable-pr-automerge:
      description: Revalidate an opted-in pull request and enable native GitHub auto-merge
      runs-on: ubuntu-latest
      inputs:
        pr_number:
          description: Pull request number
          required: true
          type: string
        expected_head_sha:
          description: Head commit evaluated by the agent
          required: true
          type: string
      permissions:
        contents: write
        pull-requests: write
      steps:
        - name: Enable auto-merge
          env:
            GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            REPO: ${{ github.repository }}
            TRIGGER_PR_NUMBER: ${{ github.event.pull_request.number }}
            TRIGGER_HEAD_SHA: ${{ github.event.pull_request.head.sha }}
          run: |
            set -euo pipefail

            PR_NUMBER=$(jq -r '.items[] | select(.type == "enable_pr_automerge") | .pr_number' "$GH_AW_AGENT_OUTPUT")
            EXPECTED_HEAD_SHA=$(jq -r '.items[] | select(.type == "enable_pr_automerge") | .expected_head_sha' "$GH_AW_AGENT_OUTPUT")

            if [[ ! "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
              echo "Invalid pull request number: $PR_NUMBER" >&2
              exit 1
            fi
            if [[ ! "$EXPECTED_HEAD_SHA" =~ ^[0-9a-f]{40}$ ]]; then
              echo "Invalid expected head SHA: $EXPECTED_HEAD_SHA" >&2
              exit 1
            fi
            if [[ "$PR_NUMBER" != "$TRIGGER_PR_NUMBER" || "$EXPECTED_HEAD_SHA" != "$TRIGGER_HEAD_SHA" ]]; then
              echo "Agent output does not match the triggering pull request and head commit." >&2
              exit 1
            fi

            PR_STATE=$(gh pr view "$PR_NUMBER" \
              --repo "$REPO" \
              --json state,isDraft,headRefOid,labels)

            if ! jq -e --arg expected_head_sha "$EXPECTED_HEAD_SHA" '
              .state == "OPEN"
              and .isDraft == false
              and .headRefOid == $expected_head_sha
              and any(.labels[]; .name == "automerge")
              and any(.labels[]; .name == "factory:merge-ready")
            ' <<< "$PR_STATE" > /dev/null; then
              echo "::warning::PR #$PR_NUMBER changed after evaluation and no longer satisfies auto-merge eligibility."
              exit 0
            fi

            gh pr merge "$PR_NUMBER" \
              --repo "$REPO" \
              --auto \
              --squash \
              --match-head-commit "$EXPECTED_HEAD_SHA"
timeout-minutes: 10
---

# Draft PR Auto-Merge

## Task

Evaluate the pull request that triggered this workflow and enable GitHub's native auto-merge only when the deterministic eligibility decision allows it.

## Process

1. Read `/tmp/gh-aw/agent/pr-state.json`.
2. Read `/tmp/gh-aw/agent/decision-state.json`.
3. Treat `decision-state.json` as authoritative. Do not override its eligibility result.
4. If `eligible` is `true`, call `enable_pr_automerge` exactly once with:
   - `pr_number`: `pull_request_number`
   - `expected_head_sha`: `head_sha`
5. If `eligible` is `false`, call `noop` with the provided `reason`.

The safe-output job independently revalidates that the pull request is open, is no longer a draft, still has the `automerge` and `factory:merge-ready` labels, and still points to the evaluated head commit. GitHub native auto-merge then waits for required checks, reviews, conversation resolution, and merge-queue requirements configured by repository rules.

## Important Rules

- Never merge or enable auto-merge for a draft pull request.
- Never merge or enable auto-merge without the `automerge` label.
- Never merge or enable auto-merge without the `factory:merge-ready` label.
- Never bypass branch protection, required reviews, required checks, or merge queues.
- Never act on a different pull request.
- Never use a head commit different from the evaluated SHA.
- Never post comments or modify labels.
