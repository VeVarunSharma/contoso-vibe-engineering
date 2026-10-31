import { z } from "zod";
import { GitHub } from "./github.js";
import { ACTOR_ID, commentSchema, type Comment } from "./schemas.js";

export function readRecord<T>(
  comments: Comment[],
  kind: string,
  schema: z.ZodType<T>,
): { id: number; value: T } | null {
  const marker = `<!-- dark-factory:${kind}:v1 -->`;
  const matching = comments.filter((comment) =>
    comment.body.startsWith(`<!-- dark-factory:${kind}:`),
  );
  if (matching.some((comment) => !comment.body.startsWith(marker)))
    throw new Error(`Unsupported ${kind} state version`);
  if (
    matching.some(
      (comment) =>
        comment.user.id !== ACTOR_ID ||
        comment.user.login !== "github-actions[bot]" ||
        comment.user.type !== "Bot",
    )
  ) {
    throw new Error(`Untrusted ${kind} state marker`);
  }
  if (matching.length > 1)
    throw new Error(`Ambiguous duplicate ${kind} state records`);
  const comment = matching[0];
  if (!comment) return null;
  const json = /```json\n([\s\S]*?)\n```/.exec(comment.body)?.[1];
  if (!json) throw new Error(`Malformed ${kind} record`);
  return { id: comment.id, value: schema.parse(JSON.parse(json)) };
}

export async function writeRecord<T extends { kind: string }>(
  github: GitHub,
  number: number,
  value: T,
  schema: z.ZodType<T>,
  summary: string,
): Promise<void> {
  schema.parse(value);
  const comments = await github.list(
    `${github.prefix}/issues/${number}/comments`,
    commentSchema,
  );
  const current = readRecord(comments, value.kind, schema);
  const body = `<!-- dark-factory:${value.kind}:v1 -->\n${summary}\n\n\`\`\`json\n${JSON.stringify(value)}\n\`\`\``;
  if (current && JSON.stringify(current.value) === JSON.stringify(value))
    return;
  await github.request(
    current ? "PATCH" : "POST",
    current
      ? `${github.prefix}/issues/comments/${current.id}`
      : `${github.prefix}/issues/${number}/comments`,
    { body },
    "state",
  );
}

export const LABELS: Record<string, [string, string]> = {
  "factory:queued": ["0E8A16", "Authorized work waiting for factory execution"],
  "factory:building": ["1D76DB", "Factory task is tracked and in progress"],
  "factory:validating": [
    "5319E7",
    "Trusted factory work is in automated validation",
  ],
  "factory:blocked": [
    "D93F0B",
    "Factory work cannot safely continue; see state record",
  ],
  "factory:needs-scope": [
    "FBCA04",
    "Factory needs concrete scope or dependency information",
  ],
  "factory:repair-requested": [
    "D93F0B",
    "Dispatcher must reconcile a bounded repair",
  ],
  "factory:merge-ready": [
    "0E8A16",
    "Exact-head automated factory merge gates passed",
  ],
  automerge: ["0E8A16", "Eligible for guarded native auto-merge"],
  "changes-requested": ["D93F0B", "Factory repair is pending"],
};

export async function addLabels(
  github: GitHub,
  number: number,
  labels: string[],
): Promise<void> {
  const existing = await github.list(
    `${github.prefix}/labels`,
    z.object({ name: z.string() }),
  );
  for (const name of labels) {
    if (existing.some((label) => label.name === name)) continue;
    const spec = LABELS[name];
    if (!spec) throw new Error(`Unknown factory label ${name}`);
    await github.request(
      "POST",
      `${github.prefix}/labels`,
      { name, color: spec[0], description: spec[1] },
      "state",
    );
  }
  await github.request(
    "POST",
    `${github.prefix}/issues/${number}/labels`,
    { labels },
    "state",
  );
}

export async function removeLabels(
  github: GitHub,
  number: number,
  names: string[],
): Promise<void> {
  const current = await github.list(
    `${github.prefix}/issues/${number}/labels`,
    z.object({ name: z.string() }),
  );
  for (const name of names.filter((entry) =>
    current.some((label) => label.name === entry),
  )) {
    await github.request(
      "DELETE",
      `${github.prefix}/issues/${number}/labels/${encodeURIComponent(name)}`,
      undefined,
      "state",
    );
  }
}
