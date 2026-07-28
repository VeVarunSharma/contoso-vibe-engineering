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
  - name: Select next actionable PR
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      REPO: ${{ github.repository }}
    run: |
      set -euo pipefail
      AGENT_DIR=/tmp/gh-aw/agent
      CANDIDATE_DIR="$AGENT_DIR/candidates"
      mkdir -p "$CANDIDATE_DIR"
      : > "$AGENT_DIR/candidates.jsonl"

      gh pr list \
        --repo "$REPO" \
        --state open \
        --limit 100 \
        --json number,isDraft,createdAt \
        --jq 'sort_by(.createdAt) | .[] | select(.isDraft == false) | .number' \
        > "$AGENT_DIR/open-pr-numbers.txt"

      OWNER=${REPO%%/*}
      NAME=${REPO#*/}

      while IFS= read -r PR_NUMBER; do
        [[ -n "$PR_NUMBER" ]] || continue
        PR_DIR="$CANDIDATE_DIR/$PR_NUMBER"
        mkdir -p "$PR_DIR"

        gh pr view "$PR_NUMBER" \
          --repo "$REPO" \
          --json number,title,url,author,assignees,isDraft,createdAt,updatedAt,baseRefName,headRefName,mergeStateStatus,reviewDecision,reviewRequests,reviews,commits,comments,labels,statusCheckRollup \
          > "$PR_DIR/pr-state.json"

        gh api graphql \
          -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved comments(first:20){nodes{author{login}body createdAt url}}}}}}}' \
          -f owner="$OWNER" \
          -f name="$NAME" \
          -F number="$PR_NUMBER" \
          --jq '.data.repository.pullRequest.reviewThreads' \
          > "$PR_DIR/review-threads.json"

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
          > "$PR_DIR/review-events.json"

        jq -n \
          --slurpfile pr "$PR_DIR/pr-state.json" \
          --slurpfile threads "$PR_DIR/review-threads.json" \
          --slurpfile events "$PR_DIR/review-events.json" \
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
            | (
                if $review_current == false then
                  if $review_pending then "wait" else "request_review" end
                elif ($unresolved_threads > 0 or $failing_checks > 0 or $p.reviewDecision == "CHANGES_REQUESTED") then
                  if $copilot_assigned then "wait" else "assign_agent" end
                elif $pending_checks > 0 then
                  "wait"
                else
                  "merge"
                end
              ) as $action
            | {
                pull_request_number: $p.number,
                title: $p.title,
                url: $p.url,
                created_at: $p.createdAt,
                latest_commit: $latest_commit,
                latest_copilot_review: $latest_copilot_review,
                review_current: $review_current,
                review_pending: $review_pending,
                unresolved_threads: $unresolved_threads,
                failing_checks: $failing_checks,
                pending_checks: $pending_checks,
                review_decision: $p.reviewDecision,
                copilot_assigned: $copilot_assigned,
                action: $action,
                priority: (
                  if $action == "merge" then 0
                  elif $action == "request_review" then 1
                  elif $action == "assign_agent" then 2
                  else 9
                  end
                )
              }
          ' > "$PR_DIR/decision-state.json"

        jq -c . "$PR_DIR/decision-state.json" >> "$AGENT_DIR/candidates.jsonl"
      done < "$AGENT_DIR/open-pr-numbers.txt"

      if [[ -s "$AGENT_DIR/candidates.jsonl" ]]; then
        jq -s '.' "$AGENT_DIR/candidates.jsonl" > "$AGENT_DIR/candidates.json"
      else
        printf '[]\n' > "$AGENT_DIR/candidates.json"
      fi

      jq '
        [ .[] | select(.action != "wait") ]
        | sort_by(.priority, .created_at, .pull_request_number)
        | .[0] // {}
      ' "$AGENT_DIR/candidates.json" > "$AGENT_DIR/decision-state.json"

      PR_NUMBER=$(jq -r '.pull_request_number // empty' "$AGENT_DIR/decision-state.json")
      if [[ -z "$PR_NUMBER" ]]; then
        jq -n \
          --slurpfile candidates "$AGENT_DIR/candidates.json" \
          '{
            action: "none",
            reason: "No actionable PRs; all open non-draft PRs are waiting on reviews, checks, or assigned fixes.",
            waiting_count: ([ $candidates[0][] | select(.action == "wait") ] | length)
          }' > "$AGENT_DIR/decision-state.json"
        printf '{}\n' > "$AGENT_DIR/selected-pr.json"
        printf '{}\n' > "$AGENT_DIR/pr-state.json"
        printf '{"nodes":[]}\n' > "$AGENT_DIR/review-threads.json"
        printf '[]\n' > "$AGENT_DIR/review-events.json"
        exit 0
      fi

      PR_DIR="$CANDIDATE_DIR/$PR_NUMBER"
      cp "$PR_DIR/pr-state.json" "$AGENT_DIR/pr-state.json"
      cp "$PR_DIR/review-threads.json" "$AGENT_DIR/review-threads.json"
      cp "$PR_DIR/review-events.json" "$AGENT_DIR/review-events.json"
      jq '{
        number: .pull_request_number,
        title,
        url,
        createdAt: .created_at
      }' "$AGENT_DIR/decision-state.json" > "$AGENT_DIR/selected-pr.json"
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
  noop:
    report-as-issue: false
  missing-data:
    create-issue: false
  missing-tool:
    create-issue: false
  jobs:
    assign-copilot-to-pr:
      description: "Assign Copilot coding agent to address feedback on one pull request"
      runs-on: ubuntu-latest
      inputs:
        pr_number:
          description: "The PR number to repair"
          required: true
          type: string
      permissions:
        actions: write
        contents: read
        issues: write
        pull-requests: read
      steps:
        - name: Assign Copilot coding agent
          env:
            GH_TOKEN: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
            DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}
            REPO: ${{ github.repository }}
            WORKFLOW: pr-merge-assistant.lock.yml
          run: |
            set -euo pipefail
            PR_NUMBER=$(jq -r '.items[] | select(.type == "assign_copilot_to_pr") | .pr_number' "$GH_AW_AGENT_OUTPUT")
            if [[ ! "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
              echo "Invalid pull request number: $PR_NUMBER" >&2
              exit 1
            fi

            gh api \
              --method POST \
              "repos/$REPO/issues/$PR_NUMBER/assignees" \
              -f 'assignees[]=copilot-swe-agent[bot]'

            CURRENT_LABELS=$(gh pr view "$PR_NUMBER" --repo "$REPO" --json labels --jq '[.labels[].name]')
            for LABEL in ready-to-merge needs-review; do
              if jq -e --arg label "$LABEL" 'index($label) != null' <<< "$CURRENT_LABELS" > /dev/null; then
                gh api --method DELETE "repos/$REPO/issues/$PR_NUMBER/labels/$LABEL"
              fi
            done

            gh api \
              --method POST \
              "repos/$REPO/issues/$PR_NUMBER/labels" \
              -f 'labels[]=changes-requested'

            gh pr comment "$PR_NUMBER" \
              --repo "$REPO" \
              --body "Copilot coding agent assigned to address unresolved review feedback or actionable CI failures. The PR will be re-reviewed after the next commit."

            gh workflow run "$WORKFLOW" \
              --repo "$REPO" \
              --ref "$DEFAULT_BRANCH"
    request-copilot-review:
      description: "Request Copilot code review on one pull request"
      runs-on: ubuntu-latest
      inputs:
        pr_number:
          description: "The PR number to review"
          required: true
          type: string
      permissions:
        actions: write
        contents: read
        issues: write
        pull-requests: write
      steps:
        - name: Request Copilot reviewer
          env:
            GH_TOKEN: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
            DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}
            REPO: ${{ github.repository }}
            WORKFLOW: pr-merge-assistant.lock.yml
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

            gh workflow run "$WORKFLOW" \
              --repo "$REPO" \
              --ref "$DEFAULT_BRANCH"
    merge-pr:
      description: "Revalidate and squash-merge one Copilot-reviewed pull request"
      runs-on: ubuntu-latest
      inputs:
        pr_number:
          description: "The PR number to merge"
          required: true
          type: string
      permissions:
        actions: write
        contents: write
        pull-requests: write
      steps:
        - name: Merge PR
          env:
            GH_TOKEN: ${{ secrets.PR_MERGE_AUTOMATION_TOKEN }}
            DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}
            REPO: ${{ github.repository }}
            WORKFLOW: pr-merge-assistant.lock.yml
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

            gh workflow run "$WORKFLOW" \
              --repo "$REPO" \
              --ref "$DEFAULT_BRANCH"
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

The deterministic prefetch step has scanned every open non-draft PR, skipped PRs already waiting on external work, and selected exactly one actionable PR. Merge-ready PRs are prioritized, followed by review requests and repair assignments. Never switch to another PR during this run. Treat `decision-state.json` as authoritative and do not override its `action`.

### Step 1: Ensure Copilot code review

Follow the `action` in `decision-state.json` exactly:

- `request_review`: call `request_copilot_review` with `pr_number`. That atomic job requests the reviewer, updates labels, and posts the status comment; do not emit separate comment or label outputs.
- `none`: call `noop` because every open non-draft PR is already waiting on review, checks, or an assigned fix.

### Step 2: Address feedback or failing checks

When `action` is `assign_agent`, call `assign_copilot_to_pr` with `pr_number` set to the selected PR number. That atomic job assigns Copilot, updates labels, and posts the status comment; do not emit separate comment or label outputs.

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
- Every open non-draft PR is already waiting on review, checks, or an assigned fix

## Important Rules

- Never merge before Copilot reviews the current head commit
- Never override an explicit `CHANGES_REQUESTED` decision
- Never merge with failing or pending checks
- Never merge with unresolved review threads
- Never treat a new commit as approval; request re-review instead
- Never process more than one PR in a run
- Do not let a waiting PR block another actionable PR
- Avoid duplicate comments and duplicate Copilot assignments
