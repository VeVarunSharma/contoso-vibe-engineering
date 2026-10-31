import { FactoryFixture } from "@test-mocks/controller";
import { execution } from "@test-mocks/factory";
import { recoveries } from "../policy.js";
import { GitHubError } from "../github.js";
import { resetBlockedItem } from "../reset.js";
import type { PullRequest, Task } from "../schemas.js";

describe("factory execution transitions", () => {
  afterEach(() => jest.restoreAllMocks());

  it("reserves durable capacity before creating a task and retains the returned task ID", async () => {
    const fixture = new FactoryFixture();
    fixture.admit();
    fixture.onTaskCreate = () => {
      expect(fixture.state()?.phase).toBe("reserved");
      expect(fixture.state()?.holdSlot).toBe(true);
      expect(fixture.state()?.attempts.at(-1)?.status).toBe("reserved");
    };
    const plan = await fixture.controller().plan("dispatch");
    expect(plan.selected?.action).toBe("start");
    await fixture.controller().apply("dispatch", plan.selected!.key);
    expect(fixture.state()?.taskId).toBe("task-1");
    expect(fixture.state()?.phase).toBe("building");
    expect(fixture.taskStarts()).toHaveLength(1);
    expect(fixture.state()?.attempts[0]?.recovery).toBe(false);
  });

  it("does not create another task when a dispatched event is replayed", async () => {
    const warning = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const fixture = new FactoryFixture();
    fixture.admit();
    const plan = await fixture.controller().plan("dispatch");
    await fixture.controller().apply("dispatch", plan.selected!.key);
    const replay = await fixture
      .controller()
      .apply("dispatch", plan.selected!.key);
    expect(replay.outcome).toBe("stale");
    expect(fixture.taskStarts()).toHaveLength(1);
    expect(warning).toHaveBeenCalledWith(
      "Factory decision became stale; no mutation was performed",
    );
  });

  it("does not spend task calls in report-only mode", async () => {
    const fixture = new FactoryFixture();
    fixture.admit();
    const plan = await fixture.controller(true, true).plan("dispatch");
    expect(plan.selected?.action).toBe("start");
    expect(fixture.calls.every((call) => call.method === "GET")).toBe(true);
    await expect(
      fixture.controller(true, true).apply("dispatch", plan.selected!.key),
    ).rejects.toThrow("Dry run cannot apply");
    expect(fixture.taskStarts()).toHaveLength(0);
  });

  it("keeps an ambiguous create outcome reserved rather than reissuing the POST", async () => {
    const fixture = new FactoryFixture();
    fixture.admit();
    fixture.uncertainCreate = true;
    const plan = await fixture.controller().plan("dispatch");
    await expect(
      fixture.controller().apply("dispatch", plan.selected!.key),
    ).rejects.toThrow("Connection lost");
    expect(fixture.state()?.phase).toBe("reserved");
    expect(fixture.state()?.holdSlot).toBe(true);
    expect(fixture.state()?.taskId).toBeNull();
    expect(fixture.taskStarts()).toHaveLength(1);
  });

  it("permits five recovery tasks after the first task, then blocks instead of launching a seventh", async () => {
    const fixture = new FactoryFixture();
    fixture.admit();
    for (let attempt = 0; attempt < 6; attempt++) {
      const plan = await fixture.controller().plan("dispatch");
      expect(plan.selected?.action).toBe(attempt === 0 ? "start" : "repair");
      await fixture.controller().apply("dispatch", plan.selected!.key);
      const latest = fixture.tasks.get(fixture.state()!.taskId!)!;
      latest.state = "failed";
      latest.sessions = latest.sessions?.map((session) => ({
        ...session,
        state: "failed",
      }));
      fixture.now = new Date(fixture.now.getTime() + 24 * 60 * 60_000);
    }
    expect(recoveries(fixture.state()!)).toBe(5);
    const exhausted = await fixture.controller().plan("dispatch");
    expect(exhausted.selected?.action).toBe("block");
    await fixture.controller().apply("dispatch", exhausted.selected!.key);
    expect(fixture.state()?.phase).toBe("blocked");
    expect(fixture.state()?.holdSlot).toBe(false);
    expect(fixture.taskStarts()).toHaveLength(6);
  });

  it("starts repair on the existing PR branch without requesting a replacement PR", async () => {
    const fixture = new FactoryFixture();
    fixture.admit();
    const head = "a".repeat(40);
    const pr: PullRequest = {
      id: 10010,
      node_id: "PR_test",
      number: 10,
      state: "open",
      draft: false,
      title: "Factory work",
      body: "Fixes #1",
      user: { id: 198982749, login: "Copilot", type: "Bot" },
      labels: [{ name: "factory:repair-requested" }],
      head: {
        ref: "copilot/factory-work",
        sha: head,
        repo: { full_name: "example/factory" },
      },
      base: { ref: "main", repo: { full_name: "example/factory" } },
      merged_at: null,
      mergeable_state: "clean",
    };
    const task: Task = {
      id: "task-1",
      state: "completed",
      repository: { id: 123 },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      artifacts: [
        { provider: "github", type: "pull", data: { id: pr.id } },
        {
          provider: "github",
          type: "branch",
          data: { head_ref: pr.head.ref, base_ref: "main" },
        },
      ],
    };
    fixture.pr = pr;
    fixture.tasks.set(task.id, task);
    fixture.seedState(
      execution({
        prNumber: pr.number,
        attempts: [
          {
            key: "00000000-0000-4000-8000-000000000001",
            operation: "task",
            recovery: false,
            status: "applied",
            createdAt: "2026-01-01T00:00:00Z",
            runId: "1",
            taskId: task.id,
            workflowRunId: null,
            expectedHead: head,
          },
        ],
      }),
    );
    const plan = await fixture.controller().plan("dispatch");
    expect(plan.selected?.action).toBe("repair");
    await fixture.controller().apply("dispatch", plan.selected!.key);
    expect(fixture.taskStarts()[0]?.body).toEqual(
      expect.objectContaining({
        head_ref: "copilot/factory-work",
        base_ref: "main",
        create_pull_request: false,
      }),
    );
  });

  it("retains the task reservation when the POST succeeds but saving the task ID is forbidden", async () => {
    const fixture = new FactoryFixture();
    fixture.admit();
    fixture.bookkeepingError = new GitHubError(403, "Cannot update comment");
    const plan = await fixture.controller().plan("dispatch");
    await expect(
      fixture.controller().apply("dispatch", plan.selected!.key),
    ).rejects.toThrow("Cannot update comment");
    expect(fixture.state()?.phase).toBe("reserved");
    expect(fixture.tasks.size).toBe(1);
    expect(fixture.state()?.holdSlot).toBe(true);
    fixture.bookkeepingError = undefined;
    const recovery = await fixture.controller().plan("dispatch");
    expect(recovery.selected?.action).toBe("recover-intent");
    await fixture.controller().apply("dispatch", recovery.selected!.key);
    expect(fixture.state()?.taskId).toBe("task-1");
    expect(fixture.taskStarts()).toHaveLength(1);
  });

  it("opens the controller circuit on a rejected credential rather than spending repeated attempts", async () => {
    const fixture = new FactoryFixture();
    fixture.admit();
    fixture.createdTaskError = new GitHubError(403, "Task permission denied");
    const plan = await fixture.controller().plan("dispatch");
    await expect(
      fixture.controller().apply("dispatch", plan.selected!.key),
    ).rejects.toThrow("Task permission denied");
    expect(fixture.state()?.reason).toBe(
      "CONTROLLER_REQUEST_REJECTED_HTTP_403",
    );
    expect(fixture.state()?.holdSlot).toBe(false);
    expect((await fixture.controller().plan("dispatch")).errors).toContain(
      "Controller launch circuit is open on #1: CONTROLLER_REQUEST_REJECTED_HTTP_403",
    );
    expect(fixture.taskStarts()).toHaveLength(1);
  });

  it("requires an explicit safe operator reset and preserves previous attempt evidence", async () => {
    const fixture = new FactoryFixture();
    fixture.admit();
    fixture.seedState(
      execution({
        phase: "blocked",
        holdSlot: false,
        taskId: null,
        reason: "RECOVERY_BUDGET_EXHAUSTED",
      }),
    );
    fixture.source.labels.push({ name: "factory:blocked" });
    await resetBlockedItem(
      fixture.controller().repo,
      1,
      "maintainer",
      fixture.now,
    );
    expect(fixture.state()?.phase).toBe("queued");
    expect(fixture.state()?.holdSlot).toBe(false);
    expect(fixture.state()?.history).toEqual([
      expect.objectContaining({
        reason: "RECOVERY_BUDGET_EXHAUSTED",
        resetBy: "maintainer",
      }),
    ]);
    expect((await fixture.controller().plan("dispatch")).selected?.action).toBe(
      "start",
    );
  });
});

describe("issue-to-merge state-machine proof", () => {
  afterEach(() => jest.restoreAllMocks());

  async function completeBuild(): Promise<FactoryFixture> {
    const fixture = new FactoryFixture();
    const intake = await fixture.controller().plan("intake");
    expect(intake.selected?.action).toBe("queue");
    await fixture.controller().apply("intake", intake.selected!.key);
    const dispatch = await fixture.controller().plan("dispatch");
    await fixture.controller().apply("dispatch", dispatch.selected!.key);
    const task = fixture.tasks.get("task-1")!;
    task.state = "completed";
    task.sessions = task.sessions?.map((session) => ({
      ...session,
      state: "completed",
    }));
    fixture.pr = {
      id: 10010,
      node_id: "PR_test",
      number: 10,
      state: "open",
      draft: true,
      title: "Work",
      body: "Fixes #1",
      user: { id: 198982749, login: "Copilot", type: "Bot" },
      labels: [],
      head: {
        ref: "copilot/factory-work",
        sha: "a".repeat(40),
        repo: { full_name: "example/factory" },
      },
      base: { ref: "main", repo: { full_name: "example/factory" } },
      merged_at: null,
      mergeable_state: "clean",
    };
    task.artifacts = [
      { provider: "github", type: "pull", data: { id: 10010 } },
      {
        provider: "github",
        type: "branch",
        data: { head_ref: "copilot/factory-work", base_ref: "main" },
      },
    ];
    const attach = await fixture.controller().plan("dispatch");
    expect(attach.selected?.action).toBe("attach");
    await fixture.controller().apply("dispatch", attach.selected!.key);
    const ready = await fixture.controller().plan("complete");
    expect(ready.selected?.action).toBe("ready");
    await fixture.controller().apply("complete", ready.selected!.key);
    return fixture;
  }

  function reviewHead(fixture: FactoryFixture): void {
    fixture.reviews = [
      {
        user: {
          id: 175728472,
          login: "copilot-pull-request-reviewer[bot]",
          type: "Bot",
        },
        state: "COMMENTED",
        commit_id: fixture.pr!.head.sha,
        submitted_at: fixture.now.toISOString(),
      },
    ];
  }

  it("admits, builds, readies, reviews, authorizes the exact head, and reconciles actual merge evidence", async () => {
    const fixture = await completeBuild();
    expect(fixture.pr?.draft).toBe(false);
    const review = await fixture.controller().plan("merge");
    expect(review.selected?.action).toBe("request-review");
    await fixture.controller().apply("merge", review.selected!.key);
    reviewHead(fixture);
    const merge = await fixture.controller().plan("merge");
    expect(merge.selected?.action).toBe("merge");
    const authorization = await fixture
      .controller()
      .apply("merge", merge.selected!.key);
    expect(authorization.outcome).toBe("merge-authorized");
    expect(authorization.decision?.headSha).toBe("a".repeat(40));
    expect(fixture.source.state).toBe("open");
    expect(fixture.state()?.holdSlot).toBe(true);
    fixture.pr!.state = "closed";
    fixture.pr!.merged_at = fixture.now.toISOString();
    const reconcile = await fixture.controller().plan("dispatch");
    expect(reconcile.selected?.action).toBe("close");
    await fixture.controller().apply("dispatch", reconcile.selected!.key);
    expect(fixture.source.state).toBe("closed");
    expect(fixture.state()?.phase).toBe("done");
    expect(fixture.state()?.holdSlot).toBe(false);
    expect(fixture.taskStarts()).toHaveLength(1);
  });

  it("does not repeatedly clear a newly requested repair when the same task was already marked complete", async () => {
    const fixture = await completeBuild();
    fixture.pr!.labels.push(
      { name: "factory:repair-requested" },
      { name: "changes-requested" },
    );
    expect((await fixture.controller().plan("complete")).selected).toBeNull();
    expect(
      (await fixture.controller().plan("dispatch")).assessments[0]?.reason,
    ).toBe("RECOVERY_BACKOFF");
    fixture.now = new Date(fixture.state()!.nextAttemptAt);
    expect((await fixture.controller().plan("dispatch")).selected?.action).toBe(
      "repair",
    );
  });

  it("requires review of a changed head instead of accepting a newer review timestamp for the wrong commit", async () => {
    const fixture = await completeBuild();
    reviewHead(fixture);
    fixture.pr!.head.sha = "b".repeat(40);
    expect((await fixture.controller().plan("merge")).selected?.action).toBe(
      "request-review",
    );
  });

  it("routes failing external checks to repair rather than excluding them as orchestration noise", async () => {
    const fixture = await completeBuild();
    reviewHead(fixture);
    fixture.checkConclusion = "failure";
    const repair = await fixture.controller().plan("merge");
    expect(repair.selected?.action).toBe("request-repair");
    await fixture.controller().apply("merge", repair.selected!.key);
    expect(fixture.pr!.labels).toContainEqual({
      name: "factory:repair-requested",
    });
    expect(fixture.taskStarts()).toHaveLength(1);
  });

  it("keeps unresolved conversations blocking merge", async () => {
    const fixture = await completeBuild();
    reviewHead(fixture);
    fixture.unresolvedThreads = true;
    expect((await fixture.controller().plan("merge")).selected?.action).toBe(
      "request-repair",
    );
  });

  it("disables pending auto-merge when the source issue is manually stopped, including paused mode", async () => {
    const fixture = await completeBuild();
    fixture.pr!.auto_merge = { enabled_by: "factory" };
    fixture.source.labels.push({ name: "factory:human-review" });
    const controller = fixture.controller(false, false, true);
    const stop = await controller.plan("merge");
    expect(stop.selected?.action).toBe("disable-merge");
    await fixture
      .controller(false, false, true)
      .apply("merge", stop.selected!.key);
    expect(fixture.pr!.auto_merge).toBeNull();
  });

  it("limits the secondary event path to its exact PR", async () => {
    const fixture = await completeBuild();
    reviewHead(fixture);
    expect(
      (await fixture.controller(false, true, false, 11).plan("merge")).selected,
    ).toBeNull();
    expect(
      (await fixture.controller(false, true, false, 10).plan("merge")).selected
        ?.prNumber,
    ).toBe(10);
  });

  it("holds old completion evidence while a newer task owns the branch", async () => {
    const fixture = await completeBuild();
    fixture.tasks.set("newer", {
      ...fixture.tasks.get("task-1")!,
      id: "newer",
      state: "in_progress",
      created_at: "2026-01-03T00:00:00Z",
    });
    expect((await fixture.controller().plan("complete")).selected).toBeNull();
    expect((await fixture.controller().plan("merge")).selected).toBeNull();
  });
});
