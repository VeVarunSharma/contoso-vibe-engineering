import { execution, issue } from "@test-mocks/factory";
import {
  actionable,
  activeCount,
  canRecover,
  canStart,
  dependencyNumbers,
  nextRetry,
  sourceFingerprint,
  stopped,
} from "../policy.js";
import { executionSchema, taskStateSchema, type Attempt } from "../schemas.js";

describe("factory admission policy", () => {
  afterEach(() => jest.clearAllMocks());

  it("recognizes concrete acceptance criteria without requiring a queue label", () => {
    expect(actionable(issue())).toEqual({ ready: true, reason: "ACTIONABLE" });
  });

  it.each([
    { body: "**Acceptance criteria**\n- [ ] …\n- [ ] …" },
    { body: "Please improve everything." },
    { title: "[EPIC] Improve factory operations" },
    { labels: [{ name: "go:needs-research" }] },
    { labels: [{ name: "type:spike" }] },
  ])("does not invent scope for %j", (overrides) => {
    expect(actionable(issue(overrides)).ready).toBe(false);
  });

  it("accepts concrete bug reproduction and expected behavior", () => {
    expect(
      actionable(
        issue({
          body: "**To Reproduce**\n1. Start the factory with an already active issue.\n2. Replay its dispatch event.\n\n**Expected behavior**\nNo second task should be created for the same issue.",
        }),
      ).ready,
    ).toBe(true);
  });

  it("rejects unfilled bug templates", () => {
    expect(
      actionable(
        issue({
          body: "**To Reproduce**\n1. Go to '...'\n2. Click on '....'\n3. Scroll down to '....'\n\n**Expected behavior**\nA clear and concise description of what you expected to happen.",
        }),
      ).ready,
    ).toBe(false);
  });

  it("extracts explicit blocking references, but not parent and incidental references", () => {
    expect(
      dependencyNumbers(
        "Parent: #30\n\nBlocked by: #31, #32\n\nSee #99 for discussion.",
      ),
    ).toEqual({
      numbers: [31, 32],
      invalid: false,
    });
  });

  it("accepts an explicit absence of dependencies", () => {
    expect(
      dependencyNumbers("Dependencies: none. This is the first item."),
    ).toEqual({ numbers: [], invalid: false });
  });

  it.each([
    "Blocked by: another team",
    "Dependencies: other/repo#123",
    "Blocked by: https://github.com/other/repo/issues/123",
  ])("holds ambiguous or cross-repository dependencies: %s", (body) => {
    expect(dependencyNumbers(body).invalid).toBe(true);
  });

  it("does not reset source identity for labels and automation timestamps", () => {
    const source = issue();
    expect(
      sourceFingerprint(
        issue({
          labels: [{ name: "factory:building" }],
          updated_at: "2026-01-02T00:00:00Z",
        }),
      ),
    ).toBe(sourceFingerprint(source));
    expect(
      sourceFingerprint(issue({ body: "Changed acceptance criteria" })),
    ).not.toBe(sourceFingerprint(source));
  });

  it("stops explicitly blocked and manually stopped work", () => {
    expect(stopped(issue({ labels: [{ name: "factory:human-review" }] }))).toBe(
      true,
    );
    expect(stopped(issue({ labels: [{ name: "factory:blocked" }] }))).toBe(
      true,
    );
    expect(stopped(issue())).toBe(false);
  });
});

describe("bounded factory execution", () => {
  const attempt = (index: number, recovery: boolean): Attempt => ({
    key: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    operation: "task",
    recovery,
    status: "applied",
    createdAt: "2026-01-01T00:00:00Z",
    runId: "1",
    taskId: `task-${index}`,
    workflowRunId: null,
    expectedHead: null,
  });

  afterEach(() => jest.clearAllMocks());

  it("counts an issue and all its PR/attempt representations as one work item", () => {
    expect(activeCount([execution(), execution({ prNumber: 10 })])).toBe(1);
  });

  it("refuses a fourth active work item", () => {
    const states = [1, 2, 3].map((number) =>
      execution({
        source: { ...execution().source, issueId: number, issueNumber: number },
      }),
    );
    expect(activeCount(states)).toBe(3);
    expect(canStart(states)).toBe(false);
    expect(canStart(states.slice(0, 2))).toBe(true);
  });

  it("retains capacity for uncertain and blocked-but-still-live tasks", () => {
    expect(activeCount([execution({ phase: "reserved" })])).toBe(1);
    expect(activeCount([execution({ phase: "blocked" })])).toBe(1);
    expect(
      activeCount([execution({ phase: "blocked", holdSlot: false })]),
    ).toBe(0);
    expect(activeCount([execution({ phase: "done", holdSlot: false })])).toBe(
      0,
    );
  });

  it("allows five recoveries after the initial attempt, but no sixth", () => {
    for (let count = 0; count < 5; count++) {
      expect(
        canRecover(
          execution({
            attempts: [
              attempt(0, false),
              ...Array.from({ length: count }, (_, index) =>
                attempt(index + 1, true),
              ),
            ],
          }),
        ),
      ).toBe(true);
    }
    const exhausted = execution({
      attempts: [
        attempt(0, false),
        ...Array.from({ length: 5 }, (_, index) => attempt(index + 1, true)),
      ],
    });
    expect(canRecover(exhausted)).toBe(false);
    expect(executionSchema.safeParse(exhausted).success).toBe(true);
    expect(
      executionSchema.safeParse({
        ...exhausted,
        attempts: [...exhausted.attempts, attempt(6, true)],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate attempt identities and lost capacity reservations", () => {
    expect(
      executionSchema.safeParse(
        execution({ attempts: [attempt(1, true), attempt(1, true)] }),
      ).success,
    ).toBe(false);
    expect(
      executionSchema.safeParse(
        execution({ phase: "reserved", holdSlot: false }),
      ).success,
    ).toBe(false);
  });

  it("applies increasing recovery backoff", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(nextRetry(execution(), now)).toBe("2026-01-01T00:15:00.000Z");
    expect(nextRetry(execution({ attempts: [attempt(1, true)] }), now)).toBe(
      "2026-01-01T00:30:00.000Z",
    );
  });

  it("does not treat unknown task states as completed or absent", () => {
    expect(taskStateSchema.safeParse("partially_completed").success).toBe(
      false,
    );
  });
});
