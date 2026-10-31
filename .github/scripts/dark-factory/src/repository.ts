import { z } from "zod";
import { GitHub, GitHubError } from "./github.js";
import {
  ACTOR_ID,
  admissionSchema,
  commentSchema,
  executionSchema,
  issueSchema,
  jobSchema,
  prSchema,
  reviewRecordSchema,
  taskSchema,
  workflowRunSchema,
  type Admission,
  type Comment,
  type Execution,
  type Issue,
  type Job,
  type PullRequest,
  type Task,
  type WorkflowRun,
} from "./schemas.js";
import {
  dependencyNumbers,
  hasLabel,
  incidentSignature,
  MONITORED_PATHS,
} from "./policy.js";
import { readRecord } from "./state.js";

const metadataSchema = z.object({
  id: z.number().int(),
  full_name: z.string(),
  default_branch: z.string(),
});
const issueLinksSchema = z.object({
  repository: z.object({
    pullRequest: z.object({
      closingIssuesReferences: z.object({
        nodes: z.array(
          z.object({
            number: z.number(),
            repository: z.object({ nameWithOwner: z.string() }),
          }),
        ),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
        }),
      }),
    }),
  }),
});
export interface WorkItem {
  issue: Issue;
  admission: Admission | null;
  execution: Execution | null;
}
export interface Incident {
  signature: string;
  run: WorkflowRun;
  job: Job | null;
  step: string;
  message: string;
  classification: "transient" | "configuration" | "code" | "stale";
  recoveredRun: number | null;
}

export class Repository {
  private issueCache = new Map<number, Issue>();
  private commentsCache = new Map<number, Comment[]>();
  private permissionCache = new Map<string, boolean>();
  private taskCache = new Map<string, Task>();
  private taskList: Task[] | null = null;
  private prCache = new Map<number, PullRequest>();
  private linksCache = new Map<number, number[]>();
  private metadataCache: z.infer<typeof metadataSchema> | null = null;
  private mainHead: string | null = null;
  private incidentCache = new Map<string, Incident>();

  constructor(readonly api: GitHub) {}

  async metadata(): Promise<z.infer<typeof metadataSchema>> {
    this.metadataCache ??= await this.api.get(this.api.prefix, metadataSchema);
    if (
      this.metadataCache.default_branch !== "main" ||
      this.metadataCache.full_name !== this.api.repository
    ) {
      throw new Error("Factory is bound to this repository's main branch");
    }
    return this.metadataCache;
  }

  async issues(): Promise<Issue[]> {
    // A closed or relabeled issue may still hold an uncertain task reservation.
    const issues = await this.api.list(
      `${this.api.prefix}/issues?state=all`,
      issueSchema,
    );
    const unique = new Map(
      issues
        .filter((issue) => !issue.pull_request)
        .map((issue) => [issue.number, issue]),
    );
    for (const [number, issue] of unique) this.issueCache.set(number, issue);
    return [...unique.values()].sort(
      (a, b) => a.created_at.localeCompare(b.created_at) || a.number - b.number,
    );
  }

  async issue(number: number): Promise<Issue> {
    const cached = this.issueCache.get(number);
    if (cached) return cached;
    const issue = await this.api.get(
      `${this.api.prefix}/issues/${number}`,
      issueSchema,
    );
    if (issue.pull_request)
      throw new Error(`Dependency #${number} is a PR, not an issue`);
    this.issueCache.set(number, issue);
    return issue;
  }

  async comments(number: number): Promise<Comment[]> {
    const cached = this.commentsCache.get(number);
    if (cached) return cached;
    if (this.issueCache.get(number)?.comments === 0) return [];
    const comments = await this.api.list(
      `${this.api.prefix}/issues/${number}/comments`,
      commentSchema,
    );
    this.commentsCache.set(number, comments);
    return comments;
  }

  async item(issue: Issue): Promise<WorkItem> {
    const comments = await this.comments(issue.number);
    const admission =
      readRecord(comments, "admission", admissionSchema)?.value ?? null;
    const execution =
      readRecord(comments, "execution", executionSchema)?.value ?? null;
    const metadata = await this.metadata();
    for (const state of [admission, execution]) {
      if (
        state &&
        (state.source.issueId !== issue.id ||
          state.source.issueNumber !== issue.number ||
          state.source.repositoryId !== metadata.id)
      ) {
        throw new Error(`State provenance mismatch on #${issue.number}`);
      }
    }
    return { issue, admission, execution };
  }

  async maintainer(login: string): Promise<boolean> {
    const cached = this.permissionCache.get(login);
    if (cached !== undefined) return cached;
    try {
      const response = await this.api.get(
        `${this.api.prefix}/collaborators/${encodeURIComponent(login)}/permission`,
        z.object({ permission: z.string() }),
      );
      const allowed = ["admin", "maintain", "write"].includes(
        response.permission,
      );
      this.permissionCache.set(login, allowed);
      return allowed;
    } catch (error) {
      if (!(error instanceof GitHubError) || error.status !== 404) throw error;
      this.permissionCache.set(login, false);
      return false;
    }
  }

  async manuallyQueued(issue: Issue): Promise<boolean> {
    if (!hasLabel(issue, "factory:queued")) return false;
    const events = await this.api.list(
      `${this.api.prefix}/issues/${issue.number}/events`,
      z.object({
        event: z.string(),
        actor: z.object({ login: z.string(), type: z.string() }).nullable(),
        label: z.object({ name: z.string() }).optional(),
      }),
    );
    const event = events
      .filter((entry) => entry.label?.name === "factory:queued")
      .at(-1);
    return (
      event?.event === "labeled" &&
      event.actor?.type === "User" &&
      (await this.maintainer(event.actor.login))
    );
  }

  async dependencies(
    issue: Issue,
    ancestors = new Set<number>(),
  ): Promise<string | null> {
    if (ancestors.has(issue.number))
      return `NEEDS_SCOPE: dependency cycle at #${issue.number}`;
    if (ancestors.size >= 100)
      return "NEEDS_SCOPE: dependency graph exceeds safe traversal bound";
    const parsed = dependencyNumbers(issue.body ?? "");
    if (parsed.invalid)
      return "NEEDS_SCOPE: ambiguous or cross-repository dependency";
    const native = await this.api.list(
      `${this.api.prefix}/issues/${issue.number}/dependencies/blocked_by`,
      z.object({ number: z.number().int().positive() }),
    );
    const branch = new Set([...ancestors, issue.number]);
    let waiting: string | null = null;
    for (const number of new Set([
      ...parsed.numbers,
      ...native.map((entry) => entry.number),
    ])) {
      let dependency: Issue;
      try {
        dependency = await this.issue(number);
      } catch (error) {
        if (!(error instanceof GitHubError) || error.status !== 404)
          throw error;
        return `NEEDS_SCOPE: missing dependency #${number}`;
      }
      const nested = await this.dependencies(dependency, branch);
      if (nested?.startsWith("NEEDS_SCOPE")) return nested;
      if (dependency.state !== "closed")
        waiting ??= `DEPENDENCY_WAIT: #${number} is open`;
    }
    return waiting;
  }

  async tasks(): Promise<Task[]> {
    if (!this.taskList) {
      const path = `agents/repos/${this.api.repository}/tasks`;
      const tasks = await this.api.list(path, taskSchema, "tasks", "tasks");
      const archived = await this.api.list(
        `${path}?is_archived=true`,
        taskSchema,
        "tasks",
        "tasks",
      );
      this.taskList = [
        ...new Map(
          [...tasks, ...archived].map((task) => [task.id, task]),
        ).values(),
      ];
      const metadata = await this.metadata();
      if (this.taskList.some((task) => task.repository.id !== metadata.id))
        throw new Error("Task repository mismatch");
    }
    return this.taskList;
  }

  async task(id: string): Promise<Task> {
    const cached = this.taskCache.get(id);
    if (cached) return cached;
    const task = await this.api.get(
      `agents/repos/${this.api.repository}/tasks/${encodeURIComponent(id)}`,
      taskSchema,
      "tasks",
    );
    if (task.repository.id !== (await this.metadata()).id || task.id !== id)
      throw new Error("Task identity mismatch");
    this.taskCache.set(id, task);
    return task;
  }

  async pr(number: number): Promise<PullRequest> {
    const cached = this.prCache.get(number);
    if (cached) return cached;
    const pr = await this.api.get(
      `${this.api.prefix}/pulls/${number}`,
      prSchema,
    );
    this.prCache.set(number, pr);
    return pr;
  }

  async openPrs(): Promise<PullRequest[]> {
    return this.api.list(`${this.api.prefix}/pulls?state=open`, prSchema);
  }

  async closingIssues(pr: PullRequest): Promise<number[]> {
    const cached = this.linksCache.get(pr.number);
    if (cached) return cached;
    const numbers: number[] = [];
    let cursor: string | null = null;
    const [owner, name] = this.api.repository.split("/");
    for (let page = 0; page < 100; page++) {
      const result: z.infer<typeof issueLinksSchema> = await this.api.graph(
        "query($owner:String!,$name:String!,$number:Int!,$cursor:String){repository(owner:$owner,name:$name){pullRequest(number:$number){closingIssuesReferences(first:100,after:$cursor){nodes{number repository{nameWithOwner}} pageInfo{hasNextPage endCursor}}}}}",
        { owner, name, number: pr.number, cursor },
        issueLinksSchema,
      );
      const connection = result.repository.pullRequest.closingIssuesReferences;
      numbers.push(
        ...connection.nodes
          .filter(
            (issue) => issue.repository.nameWithOwner === this.api.repository,
          )
          .map((issue) => issue.number),
      );
      if (!connection.pageInfo.hasNextPage) {
        this.linksCache.set(pr.number, numbers);
        return numbers;
      }
      if (
        !connection.pageInfo.endCursor ||
        connection.pageInfo.endCursor === cursor
      )
        throw new Error("Incomplete issue-link pagination");
      cursor = connection.pageInfo.endCursor;
    }
    throw new Error("Issue-link pagination exceeded safe bound");
  }

  async relatedPrs(issue: Issue): Promise<PullRequest[]> {
    const events = await this.api.list(
      `${this.api.prefix}/issues/${issue.number}/timeline`,
      z.object({
        event: z.string(),
        source: z
          .object({
            issue: z.object({
              number: z.number().int(),
              repository_url: z.string().optional(),
              html_url: z.string(),
              pull_request: z.unknown().optional(),
            }),
          })
          .optional(),
      }),
    );
    const numbers = new Set(
      events
        .filter(
          (event) =>
            event.event === "cross-referenced" &&
            event.source?.issue.pull_request &&
            event.source.issue.html_url ===
              `https://github.com/${this.api.repository}/pull/${event.source.issue.number}`,
        )
        .map((event) => event.source!.issue.number),
    );
    const result: PullRequest[] = [];
    for (const number of numbers) {
      const pr = await this.pr(number);
      if ((await this.closingIssues(pr)).includes(issue.number))
        result.push(pr);
    }

    return result;
  }

  async prForTask(task: Task): Promise<PullRequest | null> {
    const artifact = task.artifacts?.find((entry) => entry.type === "pull");
    if (!artifact || artifact.type !== "pull") return null;
    const prs = await this.api.list(
      `${this.api.prefix}/pulls?state=all`,
      prSchema,
    );
    const match = prs.find((pr) => pr.id === artifact.data.id);
    return match ? this.pr(match.number) : null;
  }

  async conflictingTask(pr: PullRequest, ownedTask: Task): Promise<boolean> {
    const summaries = await this.tasks();
    for (const entry of summaries) {
      if (entry.id === ownedTask.id) continue;
      const sameBranch = entry.artifacts?.some(
        (artifact) =>
          artifact.type === "branch" && artifact.data.head_ref === pr.head.ref,
      );
      if (!sameBranch) continue;
      // A newer terminal task is also new work the factory has not adopted.
      if (
        entry.created_at > ownedTask.created_at ||
        ["queued", "in_progress", "waiting_for_user", "idle"].includes(
          entry.state,
        )
      )
        return true;
    }
    return false;
  }

  async reviewRecord(pr: PullRequest) {
    return (
      readRecord(await this.comments(pr.number), "review", reviewRecordSchema)
        ?.value ?? null
    );
  }

  async incident(issue: Issue): Promise<Incident | null> {
    const signature =
      /<!-- automation-failure-signature:([0-9a-f]{64}) -->/.exec(
        issue.body ?? "",
      )?.[1];
    if (!signature) return null;
    if (
      issue.user.id !== ACTOR_ID ||
      issue.user.login !== "github-actions[bot]" ||
      issue.user.type !== "Bot"
    ) {
      throw new Error(`Untrusted incident producer on #${issue.number}`);
    }
    const cacheKey = `${issue.id}:${issue.updated_at}`;
    const cached = this.incidentCache.get(cacheKey);
    if (cached) return cached;
    const content =
      [
        issue.body ?? "",
        ...(await this.comments(issue.number))
          .filter(
            (comment) =>
              comment.user.id === ACTOR_ID &&
              comment.body.includes("<!-- automation-failure-update:"),
          )
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((comment) => comment.body),
      ].at(-1) ?? "";
    const runId = /- Run: \[(\d+)\]/.exec(content)?.[1];
    const jobName = /- Job: `([^`]+)`/.exec(content)?.[1];
    const step = /- Step: `([^`]+)`/.exec(content)?.[1];
    const message = /```text\n([\s\S]*?)\n```/
      .exec(content)?.[1]
      ?.replace(/@\u200b/g, "@");
    if (!runId || !jobName || !step || !message)
      throw new Error(`Incomplete incident evidence on #${issue.number}`);
    const run = await this.api.get(
      `${this.api.prefix}/actions/runs/${runId}`,
      workflowRunSchema,
    );
    const evidenceAttempt = Number(/- Attempt: (\d+)/.exec(content)?.[1] ?? 1);
    if (
      !Number.isSafeInteger(evidenceAttempt) ||
      evidenceAttempt < 1 ||
      evidenceAttempt > run.run_attempt
    )
      throw new Error("Invalid incident run attempt");
    const failedRun =
      evidenceAttempt === run.run_attempt
        ? run
        : await this.api.get(
            `${this.api.prefix}/actions/runs/${runId}/attempts/${evidenceAttempt}`,
            workflowRunSchema,
          );
    if (
      run.repository.full_name !== this.api.repository ||
      run.head_repository.full_name !== this.api.repository ||
      !MONITORED_PATHS.has(run.path) ||
      (run.head_branch !== "main" && run.event !== "pull_request_target") ||
      !["failure", "timed_out", "startup_failure"].includes(
        failedRun.conclusion ?? "",
      )
    ) {
      throw new Error(
        `Incident #${issue.number} is not an eligible trusted automation failure`,
      );
    }
    if (
      incidentSignature(run.name ?? "", run.path, jobName, step, message) !==
      signature
    ) {
      throw new Error(`Incident signature mismatch on #${issue.number}`);
    }
    const jobs = await this.api.list(
      `${this.api.prefix}/actions/runs/${run.id}/attempts/${evidenceAttempt}/jobs`,
      jobSchema,
      "read",
      "jobs",
    );
    const job = jobs.find(
      (entry) =>
        entry.name === jobName &&
        ["failure", "timed_out", "startup_failure"].includes(
          entry.conclusion ?? "",
        ),
    );
    const setupFailure =
      !job &&
      !jobs.some((entry) =>
        ["failure", "timed_out", "startup_failure"].includes(
          entry.conclusion ?? "",
        ),
      ) &&
      jobName === "Workflow setup" &&
      step === "Workflow setup";
    if (!job && !setupFailure)
      throw new Error(
        `Incident #${issue.number} has no matching failed job; no automatic repair is authorized`,
      );
    if (
      job?.steps?.length &&
      !job.steps.some(
        (entry) =>
          entry.name === step &&
          ["failure", "timed_out", "cancelled"].includes(
            entry.conclusion ?? "",
          ),
      )
    ) {
      throw new Error(
        `Incident #${issue.number} does not match the failed step`,
      );
    }
    let liveMessage = `Workflow concluded with ${failedRun.conclusion}.`;
    if (job) {
      const annotations = await this.api.list(
        `${this.api.prefix}/check-runs/${job.id}/annotations`,
        z.object({
          annotation_level: z.string(),
          title: z.string().nullable().optional(),
          message: z.string(),
          raw_details: z.string().nullable().optional(),
        }),
      );
      const annotation =
        annotations.find((entry) => entry.annotation_level === "failure") ??
        annotations[0];
      liveMessage = annotation
        ? [annotation.title, annotation.message, annotation.raw_details]
            .filter(Boolean)
            .join(": ")
        : `${job.name} / ${step} concluded with ${job.conclusion}.`;
    }
    if (
      incidentSignature(
        run.name ?? "",
        run.path,
        jobName,
        step,
        liveMessage,
      ) !== signature
    ) {
      throw new Error(
        `Incident #${issue.number} no longer matches authoritative failure annotations`,
      );
    }
    const newer = await this.api.get(
      `${this.api.prefix}/actions/workflows/${run.workflow_id}/runs?branch=main&status=success&per_page=20&created=%3E%3D${encodeURIComponent(run.created_at)}`,
      z.object({ workflow_runs: z.array(workflowRunSchema) }),
    );
    let recoveredRun: number | null = null;
    const candidates = [
      ...new Map(
        [run, ...newer.workflow_runs].map((entry) => [entry.id, entry]),
      ).values(),
    ];
    for (const candidate of candidates
      .filter(
        (entry) =>
          entry.conclusion === "success" &&
          entry.path === run.path &&
          entry.repository.full_name === this.api.repository &&
          entry.head_repository.full_name === this.api.repository &&
          entry.updated_at > failedRun.updated_at,
      )
      .slice(0, 20)) {
      const candidateJobs = await this.api.list(
        `${this.api.prefix}/actions/runs/${candidate.id}/jobs?filter=latest`,
        jobSchema,
        "read",
        "jobs",
      );
      if (
        candidateJobs.some(
          (entry) =>
            entry.name === jobName &&
            entry.conclusion === "success" &&
            entry.steps?.some(
              (entryStep) =>
                entryStep.name === step && entryStep.conclusion === "success",
            ),
        )
      ) {
        recoveredRun = candidate.id;
        break;
      }
    }
    const currentHead =
      this.mainHead ??
      (
        await this.api.get(
          `${this.api.prefix}/git/ref/heads/main`,
          z.object({
            object: z.object({ sha: z.string().regex(/^[0-9a-f]{40}$/) }),
          }),
        )
      ).object.sha;
    this.mainHead = currentHead;
    const classification =
      !recoveredRun && run.head_sha !== currentHead
        ? "stale"
        : setupFailure
          ? "configuration"
          : /EAI_AGAIN|ECONNRESET|ETIMEDOUT|service unavailable|HTTP 50[234]/i.test(
                message,
              )
            ? "transient"
            : /not configured|bad credentials|resource not accessible|insufficient permission|subscription|quota|billing/i.test(
                  message,
                )
              ? "configuration"
              : "code";
    const incident: Incident = {
      signature,
      run,
      job: job ?? null,
      step,
      message,
      classification,
      recoveredRun,
    };
    this.incidentCache.set(cacheKey, incident);
    return incident;
  }
}
