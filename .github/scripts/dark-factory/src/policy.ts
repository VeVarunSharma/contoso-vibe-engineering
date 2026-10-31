import { createHash } from "node:crypto";
import {
  COPILOT_ID,
  MAX_ACTIVE,
  MAX_RECOVERIES,
  type Execution,
  type Issue,
  type PullRequest,
  type Task,
} from "./schemas.js";

export const CONTROL_WORKFLOWS = new Set([
  "Dark Factory Intake",
  "Dark Factory Dispatch",
  "PR Merge Assistant",
  "Draft PR Auto-Merge",
  "Label Copilot PRs for Factory Validation",
  "Complete Copilot PRs for Factory Validation",
]);
export const MONITORED_PATHS = new Set([
  ".github/workflows/dark-factory-intake.lock.yml",
  ".github/workflows/dark-factory-dispatch.lock.yml",
  ".github/workflows/pr-merge-assistant.lock.yml",
  ".github/workflows/complete-copilot-prs.yml",
  ".github/workflows/label-copilot-prs.yml",
  ".github/workflows/draft-pr-automerge.lock.yml",
  ".github/workflows/multi-model-code-review.yml",
  ".github/workflows/automation-incident-reporter.yml",
]);
export const hasLabel = (
  item: { labels: { name: string }[] },
  label: string,
): boolean => item.labels.some((entry) => entry.name === label);
export const stopped = (item: { labels: { name: string }[] }): boolean =>
  hasLabel(item, "factory:human-review") || hasLabel(item, "factory:blocked");
export const digest = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const sourceFingerprint = (issue: Issue): string =>
  digest({ id: issue.id, title: issue.title, body: issue.body });
export const recoveries = (state: Execution): number =>
  state.attempts.filter((attempt) => attempt.recovery).length;
export const canRecover = (state: Execution): boolean =>
  recoveries(state) < MAX_RECOVERIES;
export const activeCount = (states: Execution[]): number =>
  new Set(
    states
      .filter((state) => state.holdSlot && state.phase !== "done")
      .map((state) => state.source.issueId),
  ).size;
export const canStart = (states: Execution[]): boolean =>
  activeCount(states) < MAX_ACTIVE;
export const taskActive = (task: Task): boolean =>
  ["queued", "in_progress", "idle", "waiting_for_user"].includes(task.state) ||
  Boolean(
    task.sessions?.some((session) =>
      ["queued", "in_progress", "idle", "waiting_for_user"].includes(
        session.state,
      ),
    ),
  );
export const nextRetry = (state: Execution, now: Date): string =>
  new Date(
    now.getTime() +
      15 * 60_000 * 2 ** Math.min(recoveries(state), MAX_RECOVERIES),
  ).toISOString();

export function trustedPr(pr: PullRequest, repository: string): boolean {
  return (
    pr.user.id === COPILOT_ID &&
    pr.user.login === "Copilot" &&
    pr.user.type === "Bot" &&
    pr.head.repo?.full_name === repository &&
    pr.base.repo.full_name === repository &&
    pr.base.ref === "main" &&
    pr.head.ref.startsWith("copilot/")
  );
}

export function taskMatchesPr(task: Task, pr: PullRequest): boolean {
  return (
    Boolean(
      task.artifacts?.some(
        (artifact) => artifact.type === "pull" && artifact.data.id === pr.id,
      ),
    ) &&
    Boolean(
      task.artifacts?.some(
        (artifact) =>
          artifact.type === "branch" &&
          artifact.data.head_ref === pr.head.ref &&
          artifact.data.base_ref === pr.base.ref,
      ),
    )
  );
}

export function taskCompleted(task: Task): boolean {
  return (
    task.state === "completed" &&
    !taskActive(task) &&
    (task.sessions === undefined ||
      task.sessions.length === 0 ||
      [...task.sessions].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      )[0]?.state === "completed")
  );
}

export function dependencyNumbers(body: string): {
  numbers: number[];
  invalid: boolean;
} {
  const numbers = new Set<number>();
  let inSection = false;
  let invalid = false;
  for (const line of body.split(/\r?\n/)) {
    const header =
      /^(?:\*\*|#{1,6}\s*)?(Blocked by|Depends on|Dependencies)(?:\*\*)?\s*:?\s*(.*)$/i.exec(
        line.trim(),
      );
    if (header) inSection = true;
    else if (
      /^(?:#{1,6}\s|\*\*|Parent\s*:)/i.test(line.trim()) ||
      (!line.trim() && inSection)
    )
      inSection = false;
    if (!inSection) continue;
    const text = header?.[2] ?? line;
    if (!text?.trim() || /^(?:none|n\/a)\b/i.test(text.trim())) continue;
    if (/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+#\d+|https?:\/\//.test(text))
      invalid = true;
    const refs = [...text.matchAll(/(?:^|\s|[,;(])#(\d+)\b/g)];
    for (const ref of refs) numbers.add(Number(ref[1]));
    if (refs.length === 0) invalid = true;
  }
  return { numbers: [...numbers], invalid };
}

export function actionable(issue: Issue): { ready: boolean; reason: string } {
  if (
    issue.labels.some((label) =>
      ["type:epic", "type:spike", "go:needs-research"].includes(label.name),
    ) ||
    /^\[(?:epic|spike)\]/i.test(issue.title)
  )
    return {
      ready: false,
      reason: "NEEDS_SCOPE: epics and research are not execution tickets",
    };
  const body = issue.body ?? "";
  const criteria =
    /(?:\*\*|#{1,6}\s*)Acceptance criteria(?:\*\*)?\s*\n([\s\S]*?)(?=\n(?:\*\*|#{1,6}\s)|$)/i.exec(
      body,
    )?.[1];
  const checks = (criteria ?? "")
    .split("\n")
    .filter((line) => /^[-*]\s+\[[ x]\]\s+\S/i.test(line));
  const concrete = checks.filter((line) => {
    const text = line.replace(/^[-*]\s+\[[ x]\]\s*/i, "").trim();
    return (
      text.length >= 15 &&
      !/^[.…\s]+$|placeholder|^concrete, verifiable|^acceptance criteria/i.test(
        text,
      )
    );
  });
  const section = (heading: string): string =>
    new RegExp(
      `(?:\\*\\*|#{1,6}\\s*)${heading}(?:\\*\\*)?\\s*\\n([\\s\\S]*?)(?=\\n(?:\\*\\*|#{1,6}\\s)|$)`,
      "i",
    )
      .exec(body)?.[1]
      ?.trim() ?? "";
  const reproduction = section("To Reproduce");
  const expected = section("Expected behavior");
  const bug =
    reproduction.length >= 35 &&
    expected.length >= 20 &&
    !/Go to ['"]?\.\.\.|A clear and concise description/i.test(
      `${reproduction}\n${expected}`,
    );
  if (concrete.length === 0 && !bug)
    return {
      ready: false,
      reason:
        "NEEDS_SCOPE: missing concrete acceptance criteria or reproduction and expected behavior",
    };
  return { ready: true, reason: "ACTIONABLE" };
}

export function normalizeIncidentMessage(value: string): string {
  return value
    .replace(/https?:\/\/[^\s)]+/gi, "<url>")
    .replace(/\b[0-9a-f]{40}\b/gi, "<sha>")
    .replace(
      /\b(run|job|check)(?:[_ -]?id)?(?:\s*[:=#-]\s*|\s+)\d+\b/gi,
      "$1 <id>",
    )
    .replace(/\b\d{4}-\d{2}-\d{2}[T ][0-9:.+-]+Z?\b/gi, "<timestamp>")
    .replace(
      /(?:[A-Z]:\\|\/(?:home|tmp|runner|__w)\/)[^\s)]+/g,
      "<runner-path>",
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .slice(0, 2000);
}

export function incidentSignature(
  workflow: string,
  path: string,
  job: string,
  step: string,
  message: string,
): string {
  return createHash("sha256")
    .update(
      [workflow, path, job, step, normalizeIncidentMessage(message)].join("\n"),
    )
    .digest("hex");
}
