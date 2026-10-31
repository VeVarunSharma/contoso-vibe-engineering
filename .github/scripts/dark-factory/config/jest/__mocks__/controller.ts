import { z } from "zod";
import { Controller } from "../../../src/controller.js";
import { GitHub, type Method, type Role } from "../../../src/github.js";
import { Repository } from "../../../src/repository.js";
import {
  admissionSchema,
  commentSchema,
  executionSchema,
  type Admission,
  type Comment,
  type Execution,
  type PullRequest,
  type Task,
} from "../../../src/schemas.js";
import { sourceFingerprint } from "../../../src/policy.js";
import { LABELS, readRecord } from "../../../src/state.js";
import { comment, issue } from "./factory.js";

export class FactoryFixture {
  source = issue();
  comments: Comment[] = [];
  prComments: Comment[] = [];
  tasks = new Map<string, Task>();
  pr: PullRequest | null = null;
  reviews: {
    user: { id: number; login: string; type: string };
    state: string;
    commit_id: string;
    submitted_at: string;
  }[] = [];
  unresolvedThreads = false;
  checkConclusion = "success";
  createdTaskError: Error | undefined;
  bookkeepingError: Error | undefined;
  now = new Date("2026-01-02T00:00:00Z");
  calls: { method: Method; path: string; body: unknown; role: Role }[] = [];
  uncertainCreate = false;
  onTaskCreate: (() => void) | undefined;

  admit(): void {
    this.source.labels = [{ name: "factory:queued" }];
    const admission: Admission = {
      version: 1,
      kind: "admission",
      source: {
        issueId: this.source.id,
        issueNumber: this.source.number,
        repositoryId: 123,
        fingerprint: sourceFingerprint(this.source),
      },
      origin: "maintainer",
      outcome: "queued",
      reason: "ACTIONABLE",
      runId: "1",
    };
    this.comments.push({
      ...comment(this.statePlaceholder()),
      body: `<!-- dark-factory:admission:v1 -->\n\`\`\`json\n${JSON.stringify(admission)}\n\`\`\``,
    });
  }

  private statePlaceholder(): Execution {
    return {
      version: 1,
      kind: "execution",
      source: {
        repositoryId: 123,
        issueId: this.source.id,
        issueNumber: 1,
        fingerprint: sourceFingerprint(this.source),
      },
      phase: "building",
      revision: 0,
      attempts: [],
      prNumber: null,
      taskId: null,
      holdSlot: true,
      reason: "BUILDING",
      nextAttemptAt: this.now.toISOString(),
    };
  }

  state(): Execution | null {
    return (
      readRecord(this.comments, "execution", executionSchema)?.value ?? null
    );
  }

  seedState(state: Execution): void {
    this.comments.push({ ...comment(state), id: 202 });
    this.source.labels = [{ name: "factory:building" }];
  }

  controller(
    dryRun = false,
    live = true,
    paused = false,
    prNumber?: number,
  ): Controller {
    const api = new GitHub(
      "example/factory",
      async (method, requestPath, body, role) => {
        this.calls.push({ method, path: requestPath, body, role });
        const path = requestPath.split("?")[0];
        if (method === "GET") {
          if (path === "user") return { id: 42 };
          if (path === "repos/example/factory")
            return {
              id: 123,
              full_name: "example/factory",
              default_branch: "main",
            };
          if (path === "repos/example/factory/issues/1") return this.source;
          if (path === "repos/example/factory/pulls/10" && this.pr)
            return this.pr;
          if (path === "repos/example/factory/issues/1/comments")
            return this.comments;
          if (path === "repos/example/factory/issues/10/comments")
            return this.prComments;
          if (path === "repos/example/factory/issues/1/labels")
            return this.source.labels;
          if (path === "repos/example/factory/issues/10/labels")
            return this.pr?.labels ?? [];
          if (path === "repos/example/factory/labels")
            return Object.keys(LABELS).map((name) => ({ name }));
          if (path === "repos/example/factory/pulls")
            return this.pr ? [this.pr] : [];
          if (path === "repos/example/factory/pulls/10/reviews")
            return this.reviews;
          if (path?.endsWith("/check-runs"))
            return {
              check_runs: [
                {
                  name: "Unit tests",
                  status: "completed",
                  conclusion: this.checkConclusion,
                  check_suite: { id: 55 },
                },
              ],
            };
          if (path === "repos/example/factory/actions/runs")
            return { workflow_runs: [] };
          if (path?.endsWith("/statuses")) return [];
          if (path === "agents/repos/example/factory/tasks")
            return { tasks: [...this.tasks.values()] };
          if (path?.startsWith("agents/repos/example/factory/tasks/")) {
            const task = this.tasks.get(path.split("/").at(-1) ?? "");
            if (!task) throw new Error("Unknown task");
            return task;
          }
        }
        if (method === "POST" && path === "graphql") {
          const { query } = z.object({ query: z.string() }).parse(body);
          if (
            query.startsWith("query") &&
            query.includes("closingIssuesReferences")
          )
            return {
              data: {
                repository: {
                  pullRequest: {
                    closingIssuesReferences: {
                      nodes: [
                        {
                          number: 1,
                          repository: { nameWithOwner: "example/factory" },
                        },
                      ],
                      pageInfo: { hasNextPage: false, endCursor: null },
                    },
                  },
                },
              },
            };
          if (query.startsWith("query") && query.includes("reviewThreads"))
            return {
              data: {
                repository: {
                  pullRequest: {
                    reviewThreads: {
                      nodes: [{ isResolved: !this.unresolvedThreads }],
                      pageInfo: { hasNextPage: false, endCursor: null },
                    },
                  },
                },
              },
            };
          if (query.includes("markPullRequestReadyForReview") && this.pr) {
            this.pr.draft = false;
            return {
              data: {
                markPullRequestReadyForReview: {
                  pullRequest: { number: this.pr.number },
                },
              },
            };
          }
          if (query.includes("disablePullRequestAutoMerge") && this.pr) {
            this.pr.auto_merge = null;
            return {
              data: {
                disablePullRequestAutoMerge: {
                  pullRequest: { number: this.pr.number },
                },
              },
            };
          }
        }
        if (method === "PATCH" && path === "repos/example/factory/issues/1") {
          this.source.state = z
            .object({ state: z.enum(["open", "closed"]) })
            .parse(body).state;
          return this.source;
        }
        if (
          method === "POST" &&
          path === "repos/example/factory/pulls/10/requested_reviewers"
        )
          return { users: [{ id: 175728472 }] };
        if (
          method === "POST" &&
          (path === "repos/example/factory/issues/1/comments" ||
            path === "repos/example/factory/issues/10/comments")
        ) {
          const parsed = z.object({ body: z.string() }).parse(body);
          const created = {
            ...comment(this.statePlaceholder()),
            id: this.comments.length + this.prComments.length + 300,
            body: parsed.body,
          };
          (path.includes("/10/") ? this.prComments : this.comments).push(
            created,
          );
          return created;
        }
        if (
          method === "PATCH" &&
          path?.startsWith("repos/example/factory/issues/comments/")
        ) {
          const id = Number(path.split("/").at(-1));
          const current = [...this.comments, ...this.prComments].find(
            (entry) => entry.id === id,
          );
          if (!current) throw new Error("Unknown comment");
          const nextBody = z.object({ body: z.string() }).parse(body).body;
          if (
            this.bookkeepingError &&
            this.tasks.size > 0 &&
            nextBody.includes('"phase":"building"')
          )
            throw this.bookkeepingError;
          current.body = nextBody;
          return commentSchema.parse(current);
        }
        if (
          method === "POST" &&
          path === "repos/example/factory/issues/10/labels" &&
          this.pr
        ) {
          const { labels } = z
            .object({ labels: z.array(z.string()) })
            .parse(body);
          this.pr.labels = [
            ...new Set([
              ...this.pr.labels.map((entry) => entry.name),
              ...labels,
            ]),
          ].map((name) => ({ name }));
          return this.pr.labels;
        }
        if (
          method === "POST" &&
          path === "repos/example/factory/issues/1/labels"
        ) {
          const { labels } = z
            .object({ labels: z.array(z.string()) })
            .parse(body);
          this.source.labels = [
            ...new Set([
              ...this.source.labels.map((entry) => entry.name),
              ...labels,
            ]),
          ].map((name) => ({ name }));
          return this.source.labels;
        }
        if (
          method === "DELETE" &&
          path?.startsWith("repos/example/factory/issues/10/labels/") &&
          this.pr
        ) {
          this.pr.labels = this.pr.labels.filter(
            (entry) =>
              entry.name !== decodeURIComponent(path.split("/").at(-1) ?? ""),
          );
          return this.pr.labels;
        }
        if (
          method === "DELETE" &&
          path?.startsWith("repos/example/factory/issues/1/labels/")
        ) {
          this.source.labels = this.source.labels.filter(
            (entry) =>
              entry.name !== decodeURIComponent(path.split("/").at(-1) ?? ""),
          );
          return this.source.labels;
        }
        if (
          method === "POST" &&
          path === "agents/repos/example/factory/tasks"
        ) {
          this.onTaskCreate?.();
          if (this.createdTaskError) throw this.createdTaskError;
          if (this.uncertainCreate)
            throw new Error("Connection lost after request submission");
          const task: Task = {
            id: `task-${this.tasks.size + 1}`,
            state: "queued",
            repository: { id: 123 },
            creator: { id: 42 },
            created_at: this.now.toISOString(),
            updated_at: this.now.toISOString(),
            artifacts: [],
            sessions: [
              {
                id: "session",
                state: "queued",
                created_at: this.now.toISOString(),
                prompt: z.object({ prompt: z.string() }).parse(body).prompt,
              },
            ],
          };
          this.tasks.set(task.id, task);
          return task;
        }
        throw new Error(`Unexpected test request ${method} ${requestPath}`);
      },
      dryRun,
    );
    const repo = new Repository(api);
    jest.spyOn(repo, "issues").mockImplementation(async () => [this.source]);
    jest.spyOn(repo, "item").mockImplementation(async (source) => ({
      issue: source,
      admission:
        readRecord(this.comments, "admission", admissionSchema)?.value ?? null,
      execution: this.state(),
    }));
    jest.spyOn(repo, "manuallyQueued").mockResolvedValue(false);
    jest.spyOn(repo, "maintainer").mockResolvedValue(true);
    jest.spyOn(repo, "dependencies").mockResolvedValue(null);
    jest
      .spyOn(repo, "relatedPrs")
      .mockImplementation(async () => (this.pr ? [this.pr] : []));
    jest.spyOn(repo, "closingIssues").mockResolvedValue([1]);
    jest
      .spyOn(repo, "tasks")
      .mockImplementation(async () => [...this.tasks.values()]);
    jest.spyOn(repo, "prForTask").mockImplementation(async () => this.pr);
    jest.spyOn(repo, "pr").mockImplementation(async () => {
      if (!this.pr) throw new Error("Missing PR");
      return this.pr;
    });
    jest.spyOn(repo, "task").mockImplementation(async (id) => {
      const task = this.tasks.get(id);
      if (!task) throw new Error(`Missing task ${id}`);
      return task;
    });
    return new Controller(repo, {
      live,
      paused,
      now: this.now,
      runId: "1000",
      prNumber,
    });
  }

  taskStarts() {
    return this.calls.filter(
      (call) =>
        call.method === "POST" &&
        call.path === "agents/repos/example/factory/tasks",
    );
  }
}
