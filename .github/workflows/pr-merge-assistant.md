---
name: PR Merge Assistant
description: Automatically reviews, repairs, and merges one open pull request at a time.
on:
  schedule: every 30 minutes
  pull_request:
    types: [synchronize, ready_for_review]
  pull_request_review:
    types: [submitted]
concurrency:
  group: pr-merge-assistant
  cancel-in-progress: false
permissions:
  contents: read
  pull-requests: read
  checks: read
  issues: read
strict: true
tools:
  bash: [cat, jq]
steps:
  - name: Prefetch oldest open PR
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      REPO: ${{ github.repository }}
    run: |
      set -euo pipefail
      mkdir -p /tmp/gh-aw/agent

      gh pr list \
        --repo "$REPO" \
        --state open \
        --limit 100 \
        --json number,title,isDraft,createdAt \
        --jq 'sort_by(.createdAt) | map(select(.isDraft == false)) | .[0] // {}' \
        > /tmp/gh-aw/agent/selected-pr.json

      PR_NUMBER=$(jq -r '.number // empty' /tmp/gh-aw/agent/selected-pr.json)
      if [[ -z "$PR_NUMBER" ]]; then
        printf '{}\n' > /tmp/gh-aw/agent/pr-state.json
        printf '{"reviewThreads":[]}\n' > /tmp/gh-aw/agent/review-threads.json
        exit 0
      fi

      gh pr view "$PR_NUMBER" \
        --repo "$REPO" \
        --json number,title,url,author,assignees,isDraft,createdAt,updatedAt,baseRefName,headRefName,mergeStateStatus,reviewDecision,reviewRequests,reviews,commits,comments,labels,statusCheckRollup \
        > /tmp/gh-aw/agent/pr-state.json

      OWNER=${REPO%%/*}
      NAME=${REPO#*/}
      gh api graphql \
        -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved comments(first:20){nodes{author{login}body createdAt url}}}}}}}' \
        -f owner="$OWNER" \
        -f name="$NAME" \
        -F number="$PR_NUMBER" \
        --jq '.data.repository.pullRequest.reviewThreads' \
        > /tmp/gh-aw/agent/review-threads.json
safe-outputs:
  add-comment:
    max: 1
    target: "*"
    hide-older-comments: true
  add-labels:
    allowed: [ready-to-merge, needs-review, changes-requested]
    target: "*"
    max: 3
  remove-labels:
    allowed: [ready-to-merge, needs-review, changes-requested]
    target: "*"
    max: 3
  add-reviewer:
    reviewers: [copilot]
    target: "*"
    max: 1
    github-token: ${{ secrets.COPILOT_GITHUB_TOKEN }}
  assign-to-agent:
    name: copilot
    allowed: [copilot]
    target: "*"
    max: 1
    github-token: ${{ secrets.COPILOT_GITHUB_TOKEN }}
  noop:
    report-as-issue: false
  missing-data:
    create-issue: false
  missing-tool:
    create-issue: false
  jobs:
    merge-pr:
      description: "Revalidate and squash-merge one approved pull request"
      runs-on: ubuntu-latest
      inputs:
        pr_number:
          description: "The PR number to merge"
          required: true
          type: string
      permissions:
        contents: write
        pull-requests: write
      steps:
        - name: Merge PR
          env:
            GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            REPO: ${{ github.repository }}
          run: |
            set -euo pipefail
            PR_NUMBER=$(cat "$GH_AW_AGENT_OUTPUT" | jq -r '.items[] | select(.type == "merge_pr") | .pr_number')
            if [[ ! "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
              echo "Invalid pull request number: $PR_NUMBER" >&2
              exit 1
            fi

            PR_STATE=$(gh pr view "$PR_NUMBER" \
              --repo "$REPO" \
              --json isDraft,reviewDecision,statusCheckRollup)

            jq -e '
              .isDraft == false
              and .reviewDecision == "APPROVED"
              and all(
                .statusCheckRollup[];
                if .__typename == "CheckRun" then
                  .status == "COMPLETED"
                  and (.conclusion == "SUCCESS" or .conclusion == "NEUTRAL" or .conclusion == "SKIPPED")
                elif .__typename == "StatusContext" then
                  .state == "SUCCESS"
                else
                  false
                end
              )
            ' <<< "$PR_STATE" > /dev/null

            OWNER=${REPO%%/*}
            NAME=${REPO#*/}
            UNRESOLVED_THREADS=$(gh api graphql \
              -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved}}}}}' \
              -f owner="$OWNER" \
              -f name="$NAME" \
              -F number="$PR_NUMBER" \
              --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length')

            if [[ "$UNRESOLVED_THREADS" != "0" ]]; then
              echo "PR #$PR_NUMBER still has $UNRESOLVED_THREADS unresolved review thread(s)." >&2
              exit 1
            fi

            gh pr merge "$PR_NUMBER" --repo "$REPO" --squash
timeout-minutes: 15
---

# PR Merge Assistant

## Task

You are a fully automated pull request merge assistant. Process exactly one pull request per run and keep that PR moving through review, repair, re-review, and merge without requiring a person to operate the workflow.

## Process

### Step 0: Load the selected PR

Read:

- `/tmp/gh-aw/agent/selected-pr.json`
- `/tmp/gh-aw/agent/pr-state.json`
- `/tmp/gh-aw/agent/review-threads.json`

The deterministic prefetch step has selected the oldest non-draft open PR. Never switch to another PR during this run. If `selected-pr.json` has no `number`, call `noop`.

### Step 1: Ensure Copilot code review

Inspect `reviews` and `reviewRequests` in `pr-state.json`.

- If there is no submitted review and Copilot is not already requested, call `add_reviewer` for reviewer `copilot`, add `needs-review`, remove `ready-to-merge`, and comment that Copilot code review was requested.
- If Copilot review is already pending, call `noop`; do not request it again or add another comment.

### Step 2: Address feedback or failing checks

Inspect the latest review state, unresolved threads, commit timestamps, assignees, and `statusCheckRollup`.

- If review feedback remains unresolved or a completed check failed, call `assign_to_agent` for this PR unless Copilot is already assigned. Add `changes-requested`, remove `ready-to-merge`, and leave one concise blocker comment.
- If Copilot is already assigned, call `noop` and wait for its commit.
- If a newer commit follows the latest blocking review, request Copilot review again with `add_reviewer` unless a review is already pending.
- If checks are pending or queued, call `noop` and wait.

### Step 3: Merge only after greenlight

Call `merge_pr` with the selected PR number only when all conditions are true:

1. At least one current `APPROVED` review exists.
2. `reviewDecision` is `APPROVED`.
3. Every check run is completed with `SUCCESS`, `NEUTRAL`, or `SKIPPED`, and every status context is `SUCCESS`.
4. Every review thread is resolved.
5. The PR is not a draft.

Before merging, remove `needs-review` and `changes-requested`, add `ready-to-merge`, and post one concise greenlight comment. The merge job independently revalidates these gates before merging.

## Noop Conditions

Use `noop` with a brief explanation when:
- No open non-draft PRs exist
- Copilot review is already pending
- Copilot is already assigned to address feedback or CI
- Checks are pending

## Important Rules

- Never merge a PR without at least one approval
- Never merge with failing or pending checks
- Never merge with unresolved review threads
- Never treat a new commit as approval; request re-review instead
- Never process more than one PR in a run
- Avoid duplicate comments and duplicate Copilot assignments
