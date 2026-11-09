import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTROL_WORKFLOWS } from "../policy.js";

const githubRoot = resolve(__dirname, "..", "..", "..", "..");
const workflow = (name: string): string =>
  readFileSync(resolve(githubRoot, "workflows", name), "utf8").replace(
    /\r\n/g,
    "\n",
  );

describe("factory workflow integration contract", () => {
  afterEach(() => jest.clearAllMocks());

  it.each([
    "dark-factory-intake.md",
    "dark-factory-dispatch.md",
    "pr-merge-assistant.md",
    "draft-pr-automerge.md",
    "complete-copilot-prs.yml",
    "label-copilot-prs.yml",
  ])("serializes mutations and uses a trusted checkout in %s", (name) => {
    const source = workflow(name);
    expect(source).toMatch(
      /^concurrency:\n {2}group: dark-factory-mutation\n {2}cancel-in-progress: false/m,
    );
    expect(source).toContain("ref: main");
    expect(source).toContain("persist-credentials: false");
    expect(source).toContain("vars.FACTORY_MODE || 'observe'");
    expect(source).not.toContain("assignees[]=copilot-swe-agent");
  });

  it("uses one shared guarded transition for both merge paths", () => {
    expect(workflow("pr-merge-assistant.md")).toContain(
      "uses: ./.github/actions/factory-transition",
    );
    expect(workflow("draft-pr-automerge.md")).toContain(
      "uses: ./.github/actions/factory-transition",
    );
    expect(workflow("draft-pr-automerge.md")).toContain(
      "FACTORY_PR_NUMBER: ${{ github.event.pull_request.number }}",
    );
    const action = readFileSync(
      resolve(githubRoot, "actions", "factory-transition", "action.yml"),
      "utf8",
    );
    expect(action).toContain('--match-head-commit "$HEAD_SHA"');
    expect(action).toContain('== "merge-authorized"');
    expect(action).toContain("factory:human-review");
    expect(action).toContain("factory:blocked");
    expect(action).not.toContain("--admin");
  });

  it("keeps regression tests outside control-plane check filtering and privileged credentials", () => {
    expect(CONTROL_WORKFLOWS.has("Dark Factory Tests")).toBe(false);
    const tests = workflow("dark-factory-tests.yml");
    expect(tests).not.toContain("pull_request_target");
    expect(tests).not.toContain("secrets.COPILOT_AGENT_TASKS_TOKEN");
    expect(tests).not.toContain("secrets.PR_MERGE_AUTOMATION_TOKEN");
    expect(tests).toContain("git diff --exit-code");
  });

  it("does not use a historical creation date as a readiness shortcut", () => {
    expect(workflow("complete-copilot-prs.yml")).not.toContain(
      "MIN_CREATED_AT",
    );
    expect(workflow("complete-copilot-prs.yml")).toContain("lane: complete");
    expect(workflow("label-copilot-prs.yml")).toContain("lane: complete");
  });
});

describe("multi-model review workflow trust contract", () => {
  const source = workflow("multi-model-code-review.yml");

  it("uses the trusted PR trigger while preserving eligibility and manual dispatch", () => {
    expect(source).toMatch(
      /^ {2}pull_request_target:\n {4}types: \[opened, synchronize, reopened, ready_for_review\]/m,
    );
    expect(source).not.toMatch(/^ {2}pull_request:/m);
    expect(source).toContain("github.event_name == 'pull_request_target'");
    expect(source).not.toContain("github.event_name == 'pull_request'");
    expect(source).toContain("workflow_dispatch:");
    expect(source).toContain("github.event.pull_request.draft == false");
    expect(source).toContain("github.event.pull_request.head.repo.fork == false");
    expect(source).toContain(
      "!endsWith(github.event.pull_request.user.login, '[bot]')",
    );
  });

  it("checks out only trusted code without persisting credentials in both jobs", () => {
    const checkouts = [
      ...source.matchAll(
        /uses: actions\/checkout@[^\n]+\n {8}with:\n((?: {10}[^\n]*\n)+)/g,
      ),
    ];
    expect(checkouts).toHaveLength(2);
    for (const checkout of checkouts) {
      expect(checkout[1]).toContain(
        "ref: ${{ github.event.pull_request.base.sha || github.sha }}",
      );
      expect(checkout[1]).toContain("persist-credentials: false");
    }
    expect(source).not.toContain("refs/pull/");
    expect(source).not.toContain("github.event.pull_request.head.sha");
    expect(source).toContain(
      "BASE_REF: ${{ github.event.pull_request.base.sha || github.sha }}",
    );
    expect(source).toContain('gh pr diff "$PR_NUMBER"');
    expect(source).toContain("--available-tools='view,grep,glob,list_directory'");
    expect(source).toContain("--disable-builtin-mcps");
  });

  it("runs regression checks when the review workflow changes", () => {
    const checks = workflow("dark-factory-tests.yml");
    expect(
      checks.match(/\.github\/workflows\/multi-model-code-review\.yml/g),
    ).toHaveLength(3);
  });
});
