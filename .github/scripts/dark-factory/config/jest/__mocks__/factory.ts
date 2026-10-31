import type { Comment, Execution, Issue } from "../../../src/schemas.js";
import { sourceFingerprint } from "../../../src/policy.js";

export function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 101,
    number: 1,
    state: "open",
    title: "Improve factory documentation",
    body: "**Acceptance criteria**\n- [ ] Document the exact factory retry policy.\n- [ ] Preserve all existing operational commands.\n\n**Additional context**\nDependencies: none.",
    user: { id: 42, login: "maintainer", type: "User" },
    labels: [],
    assignees: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    html_url: "https://github.com/example/factory/issues/1",
    ...overrides,
  };
}

export function execution(overrides: Partial<Execution> = {}): Execution {
  const source = issue();
  return {
    version: 1,
    kind: "execution",
    source: {
      repositoryId: 123,
      issueId: source.id,
      issueNumber: source.number,
      fingerprint: sourceFingerprint(source),
    },
    phase: "building",
    revision: 1,
    attempts: [],
    prNumber: null,
    taskId: "task-1",
    holdSlot: true,
    reason: "BUILDING",
    nextAttemptAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function comment(value: Execution): Comment {
  return {
    id: 201,
    body: `<!-- dark-factory:execution:v1 -->\nFactory state.\n\n\`\`\`json\n${JSON.stringify(value)}\n\`\`\``,
    user: { id: 41898282, login: "github-actions[bot]", type: "Bot" },
    created_at: "2026-01-01T00:00:00Z",
  };
}
