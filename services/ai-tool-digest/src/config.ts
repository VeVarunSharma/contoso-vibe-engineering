import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { DigestConfig } from "./types.js";

const envSchema = z.object({
  DIGEST_SMTP_HOST: z.string().min(1, "SMTP host is required"),
  DIGEST_SMTP_PORT: z.string().min(1, "SMTP port is required"),
  DIGEST_SMTP_USER: z.string().min(1, "SMTP user is required"),
  DIGEST_SMTP_PASSWORD: z.string().min(1, "SMTP password is required"),
  DIGEST_FROM_EMAIL: z.string().email("From email must be a valid address"),
  DIGEST_TO_OVERRIDE: z.string().optional(),
  DIGEST_APP_INSIGHTS_CONNECTION_STRING: z.string().optional(),
});

const recipientsSchema = z.object({
  teams: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        members: z.array(
          z.object({
            alias: z.string(),
            displayName: z.string(),
            email: z.string().email(),
          })
        ),
      })
    )
    .default([]),
});

type RecipientsFile = z.infer<typeof recipientsSchema>;
type RecipientTeam = RecipientsFile["teams"][number];
type RecipientMember = RecipientTeam["members"][number];

export function loadConfig(root: string = process.cwd()): DigestConfig {
  const parsedEnv = envSchema.parse(process.env);
  const recipientsPath = join(root, "config", "recipients.json");
  const recipientsFile = JSON.parse(
    readFileSync(recipientsPath, "utf-8")
  ) as RecipientsFile;
  const recipientsData = recipientsSchema.parse(recipientsFile);

  const override =
    parsedEnv.DIGEST_TO_OVERRIDE?.split(",")
      .map((addr: string) => addr.trim())
      .filter((value: string) => value.length > 0) ?? [];
  const uniqueRecipients = new Set<string>();

  recipientsData.teams.forEach((team: RecipientTeam) => {
    team.members.forEach((member: RecipientMember) =>
      uniqueRecipients.add(member.email)
    );
  });

  override.forEach((email: string) => uniqueRecipients.add(email));

  return {
    recipients: Array.from(uniqueRecipients.values()),
    smtp: {
      host: parsedEnv.DIGEST_SMTP_HOST,
      port: Number.parseInt(parsedEnv.DIGEST_SMTP_PORT, 10),
      user: parsedEnv.DIGEST_SMTP_USER,
      password: parsedEnv.DIGEST_SMTP_PASSWORD,
      from: parsedEnv.DIGEST_FROM_EMAIL,
    },
    appInsightsConnectionString:
      parsedEnv.DIGEST_APP_INSIGHTS_CONNECTION_STRING,
  } satisfies DigestConfig;
}
