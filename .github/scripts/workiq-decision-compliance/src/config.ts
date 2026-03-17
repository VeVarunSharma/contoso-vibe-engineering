import { z } from "zod";

/**
 * Configuration schema for the decision compliance script.
 * Validates environment variables with sensible defaults.
 */
export const configSchema = z.object({
  // Required: GitHub Copilot token for SDK authentication
  COPILOT_GITHUB_TOKEN: z.string().min(1, "COPILOT_GITHUB_TOKEN is required"),

  // Optional: Microsoft 365 tenant ID for WorkIQ
  WORKIQ_TENANT_ID: z.string().default("common"),

  // PR context from GitHub Actions
  GITHUB_HEAD_REF: z.string().default(""),
  GITHUB_REF_NAME: z.string().default(""),
  PR_TITLE: z.string().default("Manual run"),
  PR_NUMBER: z.string().default("N/A"),
  GITHUB_REPOSITORY: z.string().default(""),

  // Changed files (space-separated list from tj-actions/changed-files)
  CHANGED_FILES: z.string().default(""),

  // Configuration options
  LOOKBACK_DAYS: z.coerce.number().default(7),
  FAIL_ON_WARN: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  // Output path for the compliance report
  REPORT_PATH: z
    .string()
    .default(".github/compliance-reports/meeting-decision-compliance.md"),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Parse and validate configuration from environment variables.
 */
export function loadConfig(): Config {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Configuration validation failed:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

/**
 * Extract feature keywords from branch name.
 * e.g., "feature/user-auth" -> "user auth"
 */
export function extractKeywords(branchName: string): string {
  if (!branchName) return "";

  // Remove prefix (e.g., "feature/", "fix/", "develop/")
  const withoutPrefix = branchName.replace(/^.*\//, "");

  // Replace separators with spaces
  return withoutPrefix.replace(/[-_]/g, " ").trim();
}
