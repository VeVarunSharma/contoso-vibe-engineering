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
        printf '[]\n' > /tmp/gh-aw/agent/review-events.json
        printf '{"action":"none","reason":"No open non-draft pull requests."}\n' > /tmp/gh-aw/agent/decision-state.json
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

      gh api \
        "repos/$REPO/issues/$PR_NUMBER/timeline?per_page=100" \
        -H "Accept: application/vnd.github+json" \
        --jq '[.[]
          | select(.event == "review_requested" or .event == "review_request_removed")
          | {
              event,
              created_at,
              actor: .actor.login,
              requested_reviewer: .requested_reviewer.login
            }
        ]' \
        > /tmp/gh-aw/agent/review-events.json

      jq -n \
        --slurpfile pr /tmp/gh-aw/agent/pr-state.json \
        --slurpfile threads /tmp/gh-aw/agent/review-threads.json \
        --slurpfile events /tmp/gh-aw/agent/review-events.json \
        '
          $pr[0] as $p
          | ($threads[0].nodes // []) as $review_threads
          | ($events[0] // []) as $review_events
          | ([ $p.commits[].committedDate ] | max // "") as $latest_commit
          | ([ $p.reviews[]
                | select(.author.login | startswith("copilot-pull-request-reviewer"))
                | .submittedAt
             ] | max // "") as $latest_copilot_review
          | ([ $review_events[]
                | select((.requested_reviewer // "") == "Copilot")
             ] | sort_by(.created_at) | last // {}) as $latest_copilot_event
          | ([ $review_threads[] | select(.isResolved == false) ] | length) as $unresolved_threads
          | ([ $p.statusCheckRollup[]
                | select(
                    (.__typename == "CheckRun"
                      and .status == "COMPLETED"
                      and (.conclusion != "SUCCESS" and .conclusion != "NEUTRAL" and .conclusion != "SKIPPED"))
                    or (.__typename == "StatusContext" and .state != "SUCCESS" and .state != "PENDING")
                    or (.__typename != "CheckRun" and .__typename != "StatusContext")
                  )
             ] | length) as $failing_checks
          | ([ $p.statusCheckRollup[]
                | select(
                    (.__typename == "CheckRun" and .status != "COMPLETED")
                    or (.__typename == "StatusContext" and .state == "PENDING")
                  )
             ] | length) as $pending_checks
          | any($p.assignees[]?; ((.login // "") | ascii_downcase | contains("copilot"))) as $copilot_assigned
          | ($latest_copilot_review != "" and $latest_copilot_review >= $latest_commit) as $review_current
          | (($latest_copilot_event.event // "") == "review_requested"
              and ($latest_copilot_event.created_at // "") >= $latest_commit
              and ($latest_copilot_event.created_at // "") > $latest_copilot_review) as $review_pending
          | {
              pull_request_number: $p.number,
              latest_commit: $latest_commit,
              latest_copilot_review: $latest_copilot_review,
              review_current: $review_current,
              review_pending: $review_pending,
              unresolved_threads: $unresolved_threads,
              failing_checks: $failing_checks,
              pending_checks: $pending_checks,
              review_decision: $p.reviewDecision,
              copilot_assigned: $copilot_assigned,
              action: (
                if $review_current == false then
                  if $review_pending then "wait" else "request_review" end
                elif ($unresolved_threads > 0 or $failing_checks > 0 or $p.reviewDecision == "CHANGES_REQUESTED") then
                  if $copilot_assigned then "wait" else "assign_agent" end
                elif $pending_checks > 0 then
                  "wait"
                else
                  "merge"
                end
              )
            }
        ' > /tmp/gh-aw/agent/decision-state.json
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
  assign-to-agent:
    name: copilot
    allowed: [copilot]
    target: "*"
    max: 1
    github-token: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
  noop:
    report-as-issue: false
  missing-data:
    create-issue: false
  missing-tool:
    create-issue: false
  jobs:
    request-copilot-review:
      description: "Request Copilot code review on one pull request"
      runs-on: ubuntu-latest
      inputs:
        pr_number:
          description: "The PR number to review"
          required: true
          type: string
      permissions:
        contents: read
        issues: write
        pull-requests: write
      steps:
        - name: Request Copilot reviewer
          env:
            GH_TOKEN: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
            REPO: ${{ github.repository }}
          run: |
            set -euo pipefail
            PR_NUMBER=$(jq -r '.items[] | select(.type == "request_copilot_review") | .pr_number' "$GH_AW_AGENT_OUTPUT")
            if [[ ! "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
              echo "Invalid pull request number: $PR_NUMBER" >&2
              exit 1
            fi

            gh api \
              --method POST \
              "repos/$REPO/pulls/$PR_NUMBER/requested_reviewers" \
              -f 'reviewers[]=copilot-pull-request-reviewer[bot]'

            CURRENT_LABELS=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json labels --jq '[.labels[].name]')
            if jq -e 'index("ready-to-merge") != null' <<< "$CURRENT_LABELS" > /dev/null; then
              gh api --method DELETE "repos/$REPO/issues/$PR_NUMBER/labels/ready-to-merge"
            fi

            gh api \
              --method POST \
              "repos/$REPO/issues/$PR_NUMBER/labels" \
              -f 'labels[]=needs-review'

            gh pr comment "$PR_NUMBER" \
              --repo "$REPO" \
              --body "⏳ Copilot code review requested for the current head commit. Waiting for review analysis before merge."
    merge-pr:
      description: "Revalidate and squash-merge one Copilot-reviewed pull request"
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
            GH_TOKEN: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
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
              --json isDraft,reviewDecision,statusCheckRollup,reviews,commits)

            if ! jq -e '
              . as $pr
              | ([ $pr.commits[].committedDate ] | max // "") as $latest_commit
              | ([ $pr.reviews[]
                    | select(.author.login | startswith("copilot-pull-request-reviewer"))
                    | .submittedAt
                 ] | max // "") as $latest_copilot_review
              | $pr.isDraft == false
              and $pr.reviewDecision != "CHANGES_REQUESTED"
              and $latest_copilot_review != ""
              and $latest_copilot_review >= $latest_commit
              and all(
                $pr.statusCheckRollup[];
                if .__typename == "CheckRun" then
                  .status == "COMPLETED"
                  and (.conclusion == "SUCCESS" or .conclusion == "NEUTRAL" or .conclusion == "SKIPPED")
                elif .__typename == "StatusContext" then
                  .state == "SUCCESS"
                else
                  false
                end
              )
            ' <<< "$PR_STATE" > /dev/null; then
              echo "::warning::PR #$PR_NUMBER changed after evaluation and no longer satisfies merge gates; deferring to the next run."
              exit 0
            fi

            OWNER=${REPO%%/*}
            NAME=${REPO#*/}
            UNRESOLVED_THREADS=$(gh api graphql \
              -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved}}}}}' \
              -f owner="$OWNER" \
              -f name="$NAME" \
              -F number="$PR_NUMBER" \
              --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length')

            if [[ "$UNRESOLVED_THREADS" != "0" ]]; then
              echo "::warning::PR #$PR_NUMBER now has $UNRESOLVED_THREADS unresolved review thread(s); deferring to the next run."
              exit 0
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
- `/tmp/gh-aw/agent/review-events.json`
- `/tmp/gh-aw/agent/decision-state.json`

The deterministic prefetch step has selected the oldest non-draft open PR and computed its next transition. Never switch to another PR during this run. Treat `decision-state.json` as authoritative and do not override its `action`.

### Step 1: Ensure Copilot code review

Follow the `action` in `decision-state.json` exactly:

- `request_review`: call `request_copilot_review` with `pr_number`. That atomic job requests the reviewer, updates labels, and posts the status comment; do not emit separate comment or label outputs.
- `wait`: call `noop` with the state values that explain what is pending. Do not add comments or labels.
- `none`: call `noop` because no eligible PR exists.

### Step 2: Address feedback or failing checks

When `action` is `assign_agent`, call `assign_to_agent` with `pull_number` set to the selected PR number and `agent` set to `copilot`. Never use `issue_number` for a pull request. Also add `changes-requested`, remove `ready-to-merge`, and leave one concise blocker comment using the counts in `decision-state.json`.

### Step 3: Merge only after greenlight

When `action` is `merge`, call `merge_pr` with the selected PR number. The computed state guarantees:

1. A Copilot code review was submitted after the newest commit.
2. `reviewDecision` is not `CHANGES_REQUESTED`.
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

- Never merge before Copilot reviews the current head commit
- Never override an explicit `CHANGES_REQUESTED` decision
- Never merge with failing or pending checks
- Never merge with unresolved review threads
- Never treat a new commit as approval; request re-review instead
- Never process more than one PR in a run
- Avoid duplicate comments and duplicate Copilot assignments
