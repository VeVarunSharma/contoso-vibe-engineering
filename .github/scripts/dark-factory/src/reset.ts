import { Repository } from "./repository.js";
import { hasLabel, sourceFingerprint, taskActive } from "./policy.js";
import { admissionSchema, executionSchema } from "./schemas.js";
import { addLabels, removeLabels, writeRecord } from "./state.js";

export async function resetBlockedItem(
  repo: Repository,
  number: number,
  actor: string,
  now: Date,
  runId = "0",
): Promise<void> {
  if (!(await repo.maintainer(actor)))
    throw new Error(
      "Only a current repository maintainer can reset factory work",
    );
  const item = await repo.item(await repo.issue(number));
  const state = item.execution;
  if (!state || state.phase !== "blocked" || item.issue.state !== "open")
    throw new Error("Reset requires an open, tracked blocked issue");
  if (hasLabel(item.issue, "factory:human-review"))
    throw new Error("Remove the manual emergency stop explicitly before reset");
  if (
    state.holdSlot ||
    state.attempts.some((attempt) => attempt.status === "reserved")
  ) {
    throw new Error(
      "An ambiguous or still-live attempt must be reconciled before reset",
    );
  }
  for (const id of new Set(
    [state.taskId, ...state.attempts.map((attempt) => attempt.taskId)].filter(
      (id): id is string => id !== null,
    ),
  )) {
    const task = await repo.task(id);
    if (taskActive(task))
      throw new Error("A tracked task is still active; reset denied");
  }
  if (state.prNumber) {
    const pr = await repo.pr(state.prNumber);
    if (pr.state !== "open")
      throw new Error(
        "A closed PR must not be recreated by resetting its source issue",
      );
    if (hasLabel(pr, "factory:human-review"))
      throw new Error("The PR is manually stopped");
    if (
      state.taskId &&
      (await repo.conflictingTask(pr, await repo.task(state.taskId)))
    )
      throw new Error("Another task owns this PR branch");
  }
  await writeRecord(
    repo.api,
    number,
    {
      version: 1,
      kind: "admission",
      source: { ...state.source, fingerprint: sourceFingerprint(item.issue) },
      origin: "manual",
      outcome: "queued",
      reason: "EXPLICIT_OPERATOR_RESET",
      runId,
    },
    admissionSchema,
    `Factory enrollment reaffirmed by @${actor}.`,
  );
  await writeRecord(
    repo.api,
    number,
    {
      ...state,
      source: { ...state.source, fingerprint: sourceFingerprint(item.issue) },
      phase: "queued",
      holdSlot: false,
      attempts: [],
      history: [
        ...(state.history ?? []),
        {
          attempts: state.attempts,
          resetAt: now.toISOString(),
          resetBy: actor,
          reason: state.reason,
        },
      ],
      revision: state.revision + 1,
      reason: "EXPLICIT_OPERATOR_RESET",
      nextAttemptAt: now.toISOString(),
    },
    executionSchema,
    `Factory recovery reset explicitly by @${actor}; previous attempts retained in history.`,
  );
  await removeLabels(repo.api, number, ["factory:blocked"]);
  if (state.prNumber)
    await removeLabels(repo.api, state.prNumber, ["factory:blocked"]);
  await addLabels(repo.api, number, ["factory:queued"]);
}
