import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { Controller, type Plan } from "./controller.js";
import { cliTransport, GitHub, isRead } from "./github.js";
import { Repository } from "./repository.js";
import { resetBlockedItem } from "./reset.js";
import { fingerprint, laneSchema, type Lane } from "./schemas.js";

async function main(): Promise<void> {
  const args = parseArgs({
    allowPositionals: true,
    options: {
      repo: { type: "string" },
      output: { type: "string" },
      "decision-key": { type: "string" },
      "issue-number": { type: "string" },
    },
  });
  const command = z
    .enum(["plan", "apply", "reset"])
    .parse(args.positionals[0] ?? "plan");
  const lanes: Lane[] = args.positionals[1]
    ? [laneSchema.parse(args.positionals[1])]
    : ["intake", "dispatch", "complete", "merge"];
  if (command === "apply" && lanes.length !== 1)
    throw new Error("Apply requires one explicit lane");
  const repository = args.values.repo ?? process.env.GITHUB_REPOSITORY;
  if (!repository)
    throw new Error("Pass --repo owner/name or set GITHUB_REPOSITORY");
  const mode = z
    .enum(["observe", "live", "paused"])
    .parse(process.env.FACTORY_MODE || "observe");
  const dryRun = command === "plan";
  if (
    !dryRun &&
    (process.env.GITHUB_ACTIONS !== "true" ||
      !/^\d+$/.test(process.env.GITHUB_RUN_ID ?? ""))
  ) {
    throw new Error("Factory mutations require an authenticated Actions run");
  }
  const transport = cliTransport({
    read: process.env.GH_TOKEN,
    state: process.env.FACTORY_STATE_TOKEN,
    tasks:
      process.env.COPILOT_AGENT_TASKS_TOKEN ||
      (dryRun ? process.env.GH_TOKEN : undefined),
    automation: process.env.PR_MERGE_AUTOMATION_TOKEN,
  });
  const audit = { mode, dryRun, apiRequests: 0, mutationRequests: 0 };
  const api = new GitHub(
    repository,
    async (method, path, body, role) => {
      audit.apiRequests++;
      if (!isRead(method, path, body)) audit.mutationRequests++;
      return transport(method, path, body, role);
    },
    dryRun,
  );
  if (!dryRun) {
    if (!process.env.FACTORY_STATE_TOKEN)
      throw new Error("FACTORY_STATE_TOKEN is required for durable state");
    if (
      (command === "reset" || lanes[0] !== "intake") &&
      !process.env.COPILOT_AGENT_TASKS_TOKEN
    ) {
      throw new Error(
        "COPILOT_AGENT_TASKS_TOKEN is required; refusing to reserve work without a task credential",
      );
    }
    if (
      command === "apply" &&
      lanes[0] !== "intake" &&
      !process.env.PR_MERGE_AUTOMATION_TOKEN
    ) {
      throw new Error(
        "PR_MERGE_AUTOMATION_TOKEN is required for the factory delivery loop",
      );
    }
  }
  const prNumber = process.env.FACTORY_PR_NUMBER
    ? z.coerce.number().int().positive().parse(process.env.FACTORY_PR_NUMBER)
    : undefined;
  const controller = new Controller(new Repository(api), {
    live: mode === "live",
    paused: mode === "paused",
    runId: process.env.GITHUB_RUN_ID ?? "0",
    now: new Date(),
    prNumber,
  });
  const plans: Plan[] = [];
  let result: unknown;
  if (command === "reset") {
    if (
      process.env.GITHUB_EVENT_NAME !== "workflow_dispatch" ||
      !process.env.GITHUB_ACTOR
    )
      throw new Error("Reset requires an explicit operator workflow dispatch");
    if (mode === "paused") throw new Error("Factory is paused");
    const number = z.coerce
      .number()
      .int()
      .positive()
      .parse(args.values["issue-number"]);
    await resetBlockedItem(
      controller.repo,
      number,
      process.env.GITHUB_ACTOR,
      new Date(),
      process.env.GITHUB_RUN_ID,
    );
    result = { outcome: "reset", issueNumber: number };
  } else if (command === "apply") {
    result = await controller.apply(
      lanes[0]!,
      fingerprint.parse(args.values["decision-key"]),
    );
  } else {
    for (const lane of lanes) plans.push(await controller.plan(lane));
    result = lanes.length === 1 ? { ...plans[0], audit } : { plans, audit };
  }
  const output = JSON.stringify(result, null, 2);
  if (args.values.output) {
    mkdirSync(dirname(args.values.output), { recursive: true });
    writeFileSync(args.values.output, `${output}\n`, "utf8");
  }
  console.log(output);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = plans.length
      ? plans
          .map(
            (plan) =>
              `### Factory ${plan.lane}: ${plan.status}\n\nMode: **${mode}**. In flight: **${plan.active}/3**.\n\n` +
              `| Issue | Decision | Reason |\n| --- | --- | --- |\n` +
              plan.assessments
                .map(
                  (item) =>
                    `| #${item.issueNumber} | ${item.action} | ${item.reason.replace(/[|\r\n]/g, " ")} |`,
                )
                .join("\n") +
              (plan.errors.length
                ? `\n\n**Degraded evidence:**\n${plan.errors.map((error) => `- ${error}`).join("\n")}`
                : ""),
          )
          .join("\n\n")
      : `### Factory transition\n\n\`\`\`json\n${output}\n\`\`\``;
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, "utf8");
  }
}

main().catch((error: unknown) => {
  console.error(
    `Factory error: ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exitCode = 1;
});
