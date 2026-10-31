import { z } from "zod";

export const ACTOR_ID = 41898282;
export const COPILOT_ID = 198982749;
export const MAX_ACTIVE = 3;
export const MAX_RECOVERIES = 5;
export const POLICY_VERSION = 1;
export const API_VERSION = "2026-03-10";
export const sha = z.string().regex(/^[0-9a-f]{40}$/);
export const fingerprint = z.string().regex(/^[0-9a-f]{64}$/);
export const timestamp = z.string().datetime({ offset: true });
export const actorSchema = z.object({
  id: z.number().int(),
  login: z.string(),
  type: z.string(),
});
export const labelSchema = z.object({ name: z.string() });
export const issueSchema = z.object({
  id: z.number().int(),
  number: z.number().int().positive(),
  state: z.enum(["open", "closed"]),
  title: z.string(),
  body: z.string().nullable(),
  user: actorSchema,
  labels: z.array(labelSchema),
  assignees: z.array(actorSchema),
  created_at: timestamp,
  updated_at: timestamp,
  html_url: z.string().url(),
  comments: z.number().int().nonnegative().optional(),
  pull_request: z.unknown().optional(),
});
export type Issue = z.infer<typeof issueSchema>;
export const commentSchema = z.object({
  id: z.number().int(),
  body: z.string(),
  user: actorSchema,
  created_at: timestamp,
});
export type Comment = z.infer<typeof commentSchema>;
export const prSchema = z.object({
  id: z.number().int(),
  node_id: z.string(),
  number: z.number().int(),
  state: z.enum(["open", "closed"]),
  draft: z.boolean(),
  title: z.string(),
  body: z.string().nullable(),
  user: actorSchema,
  labels: z.array(labelSchema),
  head: z.object({
    ref: z.string(),
    sha,
    repo: z.object({ full_name: z.string() }).nullable(),
  }),
  base: z.object({
    ref: z.string(),
    repo: z.object({ full_name: z.string() }),
  }),
  merged: z.boolean().optional(),
  merged_at: timestamp.nullable(),
  mergeable_state: z.string().optional(),
  auto_merge: z.unknown().nullable().optional(),
});
export type PullRequest = z.infer<typeof prSchema>;
export const taskStateSchema = z.enum([
  "queued",
  "in_progress",
  "completed",
  "failed",
  "idle",
  "waiting_for_user",
  "timed_out",
  "cancelled",
]);
export const artifactSchema = z.discriminatedUnion("type", [
  z.object({
    provider: z.literal("github"),
    type: z.literal("pull"),
    data: z.object({ id: z.number().int() }),
  }),
  z.object({
    provider: z.literal("github"),
    type: z.literal("branch"),
    data: z.object({ head_ref: z.string(), base_ref: z.string() }),
  }),
]);
export const sessionSchema = z.object({
  id: z.string(),
  state: taskStateSchema,
  created_at: timestamp,
  updated_at: timestamp.optional(),
  prompt: z.string().optional(),
  head_ref: z.string().optional(),
  base_ref: z.string().optional(),
});
export const taskSchema = z.object({
  id: z.string(),
  state: taskStateSchema,
  repository: z.object({ id: z.number().int() }),
  creator: z.object({ id: z.number().int() }).nullable().optional(),
  created_at: timestamp,
  updated_at: timestamp,
  artifacts: z.array(artifactSchema).nullable().optional(),
  sessions: z.array(sessionSchema).optional(),
});
export type Task = z.infer<typeof taskSchema>;
export const sourceSchema = z
  .object({
    repositoryId: z.number().int(),
    issueId: z.number().int(),
    issueNumber: z.number().int().positive(),
    fingerprint,
  })
  .strict();
export const admissionSchema = z
  .object({
    version: z.literal(POLICY_VERSION),
    kind: z.literal("admission"),
    source: sourceSchema,
    origin: z.enum(["maintainer", "manual", "incident"]),
    outcome: z.enum(["queued", "needs-scope"]),
    reason: z.string(),
    runId: z.string().regex(/^\d+$/),
  })
  .strict();
export type Admission = z.infer<typeof admissionSchema>;
export const attemptSchema = z
  .object({
    key: z.string().uuid(),
    operation: z.enum(["task", "rerun", "review", "adopt"]),
    recovery: z.boolean(),
    status: z.enum(["reserved", "applied", "rejected"]),
    createdAt: timestamp,
    runId: z.string().regex(/^\d+$/),
    taskId: z.string().nullable(),
    workflowRunId: z.number().int().nullable(),
    workflowRunAttempt: z.number().int().positive().optional(),
    expectedHead: sha.nullable(),
  })
  .strict();
export type Attempt = z.infer<typeof attemptSchema>;
export const executionSchema = z
  .object({
    version: z.literal(POLICY_VERSION),
    kind: z.literal("execution"),
    source: sourceSchema,
    phase: z.enum([
      "queued",
      "reserved",
      "building",
      "validating",
      "blocked",
      "done",
    ]),
    revision: z.number().int().nonnegative(),
    attempts: z.array(attemptSchema),
    prNumber: z.number().int().positive().nullable(),
    taskId: z.string().nullable(),
    holdSlot: z.boolean(),
    reason: z.string(),
    nextAttemptAt: timestamp,
    history: z
      .array(
        z
          .object({
            attempts: z.array(attemptSchema),
            resetAt: timestamp,
            resetBy: z.string(),
            reason: z.string(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict()
  .superRefine((state, ctx) => {
    if (
      state.attempts.filter((attempt) => attempt.recovery).length >
      MAX_RECOVERIES
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Recovery history exceeds the permitted budget",
      });
    }
    if (
      new Set(state.attempts.map((attempt) => attempt.key)).size !==
      state.attempts.length
    ) {
      ctx.addIssue({ code: "custom", message: "Duplicate attempt identities" });
    }
    if (state.phase === "reserved" && !state.holdSlot) {
      ctx.addIssue({
        code: "custom",
        message: "Uncertain task creation must retain its capacity reservation",
      });
    }
  });
export type Execution = z.infer<typeof executionSchema>;
export const reviewRecordSchema = z
  .object({
    version: z.literal(POLICY_VERSION),
    kind: z.literal("review"),
    prId: z.number().int(),
    head: sha,
    requestedAt: timestamp,
    runId: z.string().regex(/^\d+$/),
  })
  .strict();
export type ReviewRecord = z.infer<typeof reviewRecordSchema>;
export const completionSchema = z
  .object({
    version: z.literal(POLICY_VERSION),
    kind: z.literal("completion"),
    prId: z.number().int(),
    taskId: z.string(),
    head: sha,
    runId: z.string().regex(/^\d+$/),
  })
  .strict();
export const laneSchema = z.enum(["intake", "dispatch", "complete", "merge"]);
export type Lane = z.infer<typeof laneSchema>;
export const actionSchema = z.enum([
  "queue",
  "scope",
  "start",
  "adopt",
  "attach",
  "recover-intent",
  "repair",
  "rerun",
  "retry-review",
  "block",
  "close",
  "ready",
  "request-review",
  "request-repair",
  "merge",
  "disable-merge",
  "recover-operation",
  "labels",
]);
export type Action = z.infer<typeof actionSchema>;
export interface Decision {
  lane: Lane;
  action: Action;
  issueNumber: number;
  prNumber: number | null;
  headSha: string | null;
  reason: string;
  key: string;
}
export interface Assessment {
  issueNumber: number;
  reason: string;
  action: Action | "wait" | "excluded";
}
export const workflowRunSchema = z.object({
  id: z.number().int(),
  workflow_id: z.number().int(),
  path: z.string(),
  name: z.string().nullable(),
  head_sha: sha,
  head_branch: z.string(),
  event: z.string(),
  status: z.string(),
  conclusion: z.string().nullable(),
  run_attempt: z.number().int(),
  created_at: timestamp,
  updated_at: timestamp,
  repository: z.object({ full_name: z.string() }),
  head_repository: z.object({ full_name: z.string() }),
});
export type WorkflowRun = z.infer<typeof workflowRunSchema>;
export const jobSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  conclusion: z.string().nullable(),
  steps: z
    .array(z.object({ name: z.string(), conclusion: z.string().nullable() }))
    .optional(),
});
export type Job = z.infer<typeof jobSchema>;
