import { z } from "zod";
import { issue } from "@test-mocks/factory";
import { GitHub, GitHubError, type Transport } from "../github.js";
import { Repository } from "../repository.js";
import { incidentSignature } from "../policy.js";

describe("dependency evidence", () => {
  afterEach(() => jest.restoreAllMocks());

  function repoWith(dependencies: Record<number, string>): Repository {
    const transport: Transport = async (method, path) => {
      if (method !== "GET") throw new Error("Unexpected mutation");
      if (path.includes("/dependencies/blocked_by?")) return [];
      const number = Number(path.split("/").at(-1));
      if (!(number in dependencies))
        throw new GitHubError(404, "Missing issue");
      return issue({ id: 100 + number, number, body: dependencies[number] });
    };
    return new Repository(new GitHub("example/factory", transport));
  }

  it("does not overlook a cycle because an earlier prerequisite is still open", async () => {
    const repo = repoWith({
      1: "Blocked by: #2, #3",
      2: "Dependencies: none.",
      3: "Blocked by: #1",
    });
    expect(await repo.dependencies(await repo.issue(1))).toContain(
      "dependency cycle",
    );
  });

  it("does not treat a missing prerequisite as completed", async () => {
    const repo = repoWith({ 1: "Blocked by: #5" });
    expect(await repo.dependencies(await repo.issue(1))).toBe(
      "NEEDS_SCOPE: missing dependency #5",
    );
  });

  it("keeps an open prerequisite waiting", async () => {
    const repo = repoWith({ 1: "Blocked by: #2", 2: "Dependencies: none." });
    expect(await repo.dependencies(await repo.issue(1))).toBe(
      "DEPENDENCY_WAIT: #2 is open",
    );
  });
});

describe("canonical incident recovery", () => {
  const path = ".github/workflows/pr-merge-assistant.lock.yml";
  const message =
    "getaddrinfo EAI_AGAIN productionresults.blob.core.windows.net";
  const signature = incidentSignature(
    "PR Merge Assistant",
    path,
    "activation",
    "Upload activation artifact",
    message,
  );
  const source = () =>
    issue({
      number: 477,
      title: "[automation incident] PR Merge Assistant: activation",
      user: { id: 41898282, login: "github-actions[bot]", type: "Bot" },
      body: `<!-- automation-failure-signature:${signature} -->\n- Run: [50](https://github.com/example/factory/actions/runs/50)\n- Attempt: 1\n- Job: \`activation\`\n- Step: \`Upload activation artifact\`\n\n\`\`\`text\n${message}\n\`\`\``,
    });
  const run = (id: number, conclusion: string) => ({
    id,
    workflow_id: 10,
    name: "PR Merge Assistant",
    path,
    head_sha: "a".repeat(40),
    head_branch: "main",
    status: "completed",
    conclusion,
    event: "schedule",
    run_attempt: 1,
    created_at: id === 50 ? "2026-01-01T00:00:00Z" : "2026-01-02T00:00:00Z",
    updated_at: id === 50 ? "2026-01-01T00:05:00Z" : "2026-01-02T00:05:00Z",
    repository: { full_name: "example/factory" },
    head_repository: { full_name: "example/factory" },
  });
  const job = (conclusion: string, stepConclusion = conclusion) => ({
    id: 70,
    name: "activation",
    conclusion,
    steps: [{ name: "Upload activation artifact", conclusion: stepConclusion }],
  });

  function repository(
    recoveryStep = "success",
    annotation = message,
    rerun = false,
    head = "a".repeat(40),
  ): Repository {
    const transport: Transport = async (method, requestPath) => {
      if (method !== "GET")
        throw new Error("Incident verification must be read-only");
      if (requestPath === "repos/example/factory/git/ref/heads/main")
        return { object: { sha: head } };
      if (requestPath.includes("/issues/477/comments")) return [];
      if (requestPath === "repos/example/factory/actions/runs/50")
        return rerun
          ? {
              ...run(50, "success"),
              run_attempt: 2,
              updated_at: "2026-01-02T00:05:00Z",
            }
          : run(50, "failure");
      if (requestPath.endsWith("/runs/50/attempts/1"))
        return run(50, "failure");
      if (requestPath.includes("/runs/50/attempts/1/jobs"))
        return { jobs: [job("failure")] };
      if (requestPath.includes("/check-runs/70/annotations"))
        return [{ annotation_level: "failure", message: annotation }];
      if (requestPath.includes("/workflows/10/runs?"))
        return { workflow_runs: rerun ? [] : [run(51, "success")] };
      if (
        requestPath.includes("/runs/51/jobs") ||
        (rerun && requestPath.includes("/runs/50/jobs"))
      )
        return { jobs: [job("success", recoveryStep)] };
      throw new Error(`Unexpected incident read ${requestPath}`);
    };
    return new Repository(new GitHub("example/factory", transport));
  }

  afterEach(() => jest.restoreAllMocks());

  it("verifies a later success of the exact failed step, not just the workflow conclusion", async () => {
    expect((await repository().incident(source()))?.recoveredRun).toBe(51);
  });

  it("rejects a green run where the previously failed step was skipped", async () => {
    const result = await repository("skipped").incident(source());
    expect(result?.recoveredRun).toBeNull();
    expect(result?.classification).toBe("transient");
  });

  it("does not turn an old failure into a new repair without current-revision evidence", async () => {
    expect(
      (
        await repository("skipped", message, false, "b".repeat(40)).incident(
          source(),
        )
      )?.classification,
    ).toBe("stale");
  });

  it("reconciles a successful rerun against its original failed attempt", async () => {
    expect(
      (await repository("success", message, true).incident(source()))
        ?.recoveredRun,
    ).toBe(50);
  });

  it("requires live annotations to match the incident signature", async () => {
    await expect(
      repository("success", "different failure").incident(source()),
    ).rejects.toThrow("authoritative failure annotations");
  });

  it("rejects an incident marker from an untrusted author", async () => {
    await expect(
      repository().incident({
        ...source(),
        user: { id: 5, login: "github-actions[bot]", type: "User" },
      }),
    ).rejects.toThrow("Untrusted incident");
  });

  it("fails closed when the failed-job response is malformed", async () => {
    const api = new GitHub(
      "example/factory",
      jest.fn().mockResolvedValue({ broken: [] }),
    );
    await expect(
      api.list(
        "repos/example/factory/actions/runs/50/jobs",
        z.object({ id: z.number() }),
        "read",
        "jobs",
      ),
    ).rejects.toThrow();
  });
});
