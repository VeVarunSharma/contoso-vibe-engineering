import { z } from "zod";
import { Repository } from "./repository.js";
import {
  CONTROL_WORKFLOWS,
  hasLabel,
  MONITORED_PATHS,
  taskCompleted,
  taskMatchesPr,
  trustedPr,
} from "./policy.js";
import { type Execution, type PullRequest } from "./schemas.js";

const threadPageSchema = z.object({
  repository: z.object({
    pullRequest: z.object({
      reviewThreads: z.object({
        nodes: z.array(z.object({ isResolved: z.boolean() })),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
        }),
      }),
    }),
  }),
});

export interface Assurance {
  ready: boolean;
  reviewCurrent: boolean;
  reviewPending: boolean;
  needsRepair: boolean;
  reasons: string[];
}

export async function assurance(
  repo: Repository,
  pr: PullRequest,
  state: Execution,
): Promise<Assurance> {
  const reasons: string[] = [];
  if (
    !trustedPr(pr, repo.api.repository) ||
    pr.state !== "open" ||
    !state.taskId ||
    !(await repo.closingIssues(pr)).includes(state.source.issueNumber)
  ) {
    return {
      ready: false,
      reviewCurrent: false,
      reviewPending: false,
      needsRepair: false,
      reasons: ["PROVENANCE"],
    };
  }
  const task = await repo.task(state.taskId);
  if (!taskCompleted(task) || !taskMatchesPr(task, pr)) {
    return {
      ready: false,
      reviewCurrent: false,
      reviewPending: false,
      needsRepair: false,
      reasons: ["TASK_NOT_COMPLETED"],
    };
  }
  if (await repo.conflictingTask(pr, task)) {
    return {
      ready: false,
      reviewCurrent: false,
      reviewPending: false,
      needsRepair: false,
      reasons: ["TASK_NOT_COMPLETED"],
    };
  }
  const reviews = await repo.api.list(
    `${repo.api.prefix}/pulls/${pr.number}/reviews`,
    z.object({
      user: z.object({ id: z.number(), login: z.string(), type: z.string() }),
      state: z.string(),
      commit_id: z.string(),
      submitted_at: z.string(),
    }),
  );
  const copilotReviews = reviews.filter(
    (review) =>
      review.user.id === 175728472 &&
      review.user.login === "copilot-pull-request-reviewer[bot]" &&
      review.user.type === "Bot" &&
      review.commit_id === pr.head.sha &&
      ["APPROVED", "COMMENTED", "CHANGES_REQUESTED"].includes(review.state),
  );
  const reviewCurrent = copilotReviews.length > 0;
  const latestByReviewer = new Map<number, string>();
  for (const review of [...reviews].sort((a, b) =>
    a.submitted_at.localeCompare(b.submitted_at),
  )) {
    if (["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state))
      latestByReviewer.set(review.user.id, review.state);
  }
  if ([...latestByReviewer.values()].includes("CHANGES_REQUESTED"))
    reasons.push("CHANGES_REQUESTED");
  let unresolved = false;
  let cursor: string | null = null;
  const [owner, name] = repo.api.repository.split("/");
  for (let page = 0; page < 100; page++) {
    const data: z.infer<typeof threadPageSchema> = await repo.api.graph(
      "query($owner:String!,$name:String!,$number:Int!,$cursor:String){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100,after:$cursor){nodes{isResolved}pageInfo{hasNextPage endCursor}}}}}",
      { owner, name, number: pr.number, cursor },
      threadPageSchema,
    );
    const threads = data.repository.pullRequest.reviewThreads;
    unresolved ||= threads.nodes.some((thread) => !thread.isResolved);
    if (!threads.pageInfo.hasNextPage) break;
    if (
      !threads.pageInfo.endCursor ||
      threads.pageInfo.endCursor === cursor ||
      page === 99
    )
      throw new Error("Incomplete review-thread pagination");
    cursor = threads.pageInfo.endCursor;
  }
  if (unresolved) reasons.push("UNRESOLVED_THREADS");
  if (pr.mergeable_state === "dirty") reasons.push("MERGE_CONFLICT");
  if (!pr.mergeable_state || pr.mergeable_state === "unknown")
    reasons.push("MERGEABILITY_PENDING");
  const checks = await repo.api.list(
    `${repo.api.prefix}/commits/${pr.head.sha}/check-runs?filter=latest`,
    z.object({
      name: z.string(),
      status: z.string(),
      conclusion: z.string().nullable(),
      check_suite: z.object({ id: z.number() }),
    }),
    "read",
    "check_runs",
  );
  const runs = await repo.api.list(
    `${repo.api.prefix}/actions/runs?head_sha=${pr.head.sha}`,
    z.object({
      name: z.string().nullable(),
      check_suite_id: z.number(),
      path: z.string(),
    }),
    "read",
    "workflow_runs",
  );
  const internalSuites = new Set(
    runs
      .filter(
        (run) =>
          CONTROL_WORKFLOWS.has(run.name ?? "") &&
          MONITORED_PATHS.has(run.path),
      )
      .map((run) => run.check_suite_id),
  );
  const external = checks.filter(
    (check) => !internalSuites.has(check.check_suite.id),
  );
  const statuses = await repo.api.list(
    `${repo.api.prefix}/commits/${pr.head.sha}/statuses`,
    z.object({ context: z.string(), state: z.string() }),
  );
  const latestStatuses = new Map<string, string>();
  for (const status of statuses)
    if (!latestStatuses.has(status.context))
      latestStatuses.set(status.context, status.state);
  if (external.length + latestStatuses.size === 0)
    reasons.push("NO_EXTERNAL_CHECKS");
  if (
    external.some((check) => check.status !== "completed") ||
    [...latestStatuses.values()].includes("pending")
  )
    reasons.push("CHECKS_PENDING");
  if (
    external.some(
      (check) =>
        check.status === "completed" &&
        !["success", "neutral", "skipped"].includes(check.conclusion ?? ""),
    ) ||
    [...latestStatuses.values()].some(
      (status) => !["success", "pending"].includes(status),
    )
  )
    reasons.push("CHECKS_FAILED");
  const reviewRecord = await repo.reviewRecord(pr);
  const reviewPending =
    !reviewCurrent &&
    reviewRecord?.prId === pr.id &&
    reviewRecord.head === pr.head.sha;
  if (!reviewCurrent) reasons.push("REVIEW_NOT_CURRENT");
  if (pr.draft) reasons.push("DRAFT");
  if (
    hasLabel(pr, "changes-requested") ||
    hasLabel(pr, "factory:repair-requested")
  )
    reasons.push("REPAIR_PENDING");
  return {
    ready: reasons.length === 0,
    reviewCurrent,
    reviewPending,
    needsRepair: reasons.some((reason) =>
      [
        "CHANGES_REQUESTED",
        "UNRESOLVED_THREADS",
        "MERGE_CONFLICT",
        "CHECKS_FAILED",
      ].includes(reason),
    ),
    reasons,
  };
}
