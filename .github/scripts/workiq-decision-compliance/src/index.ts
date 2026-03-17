/**
 * WorkIQ Decision Compliance Check
 *
 * This script uses the GitHub Copilot SDK to analyze PR changes against
 * meeting decisions and agreements queried from Microsoft 365 via WorkIQ.
 *
 * Usage:
 *   COPILOT_GITHUB_TOKEN=xxx node dist/index.js
 */

import { writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { CopilotClient } from "@github/copilot-sdk";

import { loadConfig, extractKeywords } from "./config.js";
import { parseComplianceResult, createDefaultResult } from "./types.js";
import type { ComplianceContext, ComplianceResult } from "./types.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts.js";

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  console.log("🚀 Starting WorkIQ Decision Compliance Check...\n");

  // Load and validate configuration
  const config = loadConfig();

  // Determine branch name (prefer head_ref for PRs)
  const branch = config.GITHUB_HEAD_REF || config.GITHUB_REF_NAME || "unknown";
  const keywords = extractKeywords(branch);

  console.log(`📋 Configuration:`);
  console.log(`   Repository: ${config.GITHUB_REPOSITORY}`);
  console.log(`   PR: #${config.PR_NUMBER} - ${config.PR_TITLE}`);
  console.log(`   Branch: ${branch}`);
  console.log(`   Keywords: "${keywords}"`);
  console.log(`   Lookback: ${config.LOOKBACK_DAYS} days`);
  console.log(`   Report path: ${config.REPORT_PATH}\n`);

  // Build context for the agent
  const context: ComplianceContext = {
    repository: config.GITHUB_REPOSITORY,
    prNumber: config.PR_NUMBER,
    prTitle: config.PR_TITLE,
    branch,
    keywords,
    lookbackDays: config.LOOKBACK_DAYS,
    changedFiles: config.CHANGED_FILES.split(" ").filter(Boolean),
  };

  // Initialize the Copilot SDK client
  const client = new CopilotClient();

  let result: ComplianceResult = createDefaultResult();
  let reportContent = "";

  try {
    console.log("🔌 Starting Copilot SDK client...");
    await client.start();

    console.log("📡 Creating session with WorkIQ MCP server...");
    const session = await client.createSession({
      model: "claude-sonnet-4-20250514",

      // Configure WorkIQ as an MCP server (key-value format)
      mcpServers: {
        workiq: {
          command: "npx",
          args: ["-y", "@microsoft/workiq", "mcp"],
          env: {
            WORKIQ_TENANT_ID: config.WORKIQ_TENANT_ID,
          },
          tools: ["*"], // Allow all tools from WorkIQ MCP server
        },
      },

      // Auto-approve permission requests in CI (non-interactive)
      onPermissionRequest: async () => ({ kind: "approved" as const }),

      // System prompt defines the agent's behavior
      systemMessage: {
        mode: "replace",
        content: SYSTEM_PROMPT,
      },
    });

    console.log(
      "🤖 Running compliance analysis (this may take a few minutes)...\n",
    );

    // Send the prompt and wait for the response
    const response = await session.sendAndWait(
      {
        prompt: buildUserPrompt(context),
      },
      300000, // 5 minute timeout
    );

    // Extract the content from the response
    if (response?.data?.content) {
      reportContent = response.data.content;
      console.log("✅ Analysis complete. Parsing results...\n");

      // Parse the structured result from the response
      const parsed = parseComplianceResult(reportContent);
      if (parsed) {
        result = parsed;
      } else {
        console.warn("⚠️  Could not parse structured JSON from response.");
        // Try to infer status from content
        if (
          reportContent.includes('"status": "FAIL"') ||
          reportContent.includes('"status":"FAIL"')
        ) {
          result.status = "FAIL";
        } else if (
          reportContent.includes('"status": "WARN"') ||
          reportContent.includes('"status":"WARN"')
        ) {
          result.status = "WARN";
        } else if (
          reportContent.includes('"status": "PASS"') ||
          reportContent.includes('"status":"PASS"')
        ) {
          result.status = "PASS";
        }
      }
    } else {
      console.error("❌ No content in response from Copilot SDK.");
      reportContent = generateFallbackReport(
        context,
        "No response from compliance agent.",
      );
    }

    // Clean up the session
    await session.destroy();
  } catch (error) {
    console.error("❌ Error during compliance analysis:", error);
    reportContent = generateFallbackReport(
      context,
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    // Stop the client
    await client.stop();
  }

  // Write the report to disk
  console.log(`📝 Writing report to ${config.REPORT_PATH}...`);
  mkdirSync(dirname(config.REPORT_PATH), { recursive: true });
  writeFileSync(config.REPORT_PATH, reportContent, "utf-8");

  // Output summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 COMPLIANCE SUMMARY");
  console.log("=".repeat(60));
  console.log(`   Status: ${formatStatus(result.status)}`);
  console.log(`   Decisions Checked: ${result.decisions_checked}`);
  console.log(`   Violations: ${result.violations.length}`);
  console.log(`   Warnings: ${result.warnings.length}`);
  console.log(`   Compliant Items: ${result.compliant_items.length}`);
  console.log("=".repeat(60) + "\n");

  // Set output for GitHub Actions
  writeGitHubOutput("status", result.status);
  writeGitHubOutput("violations", String(result.violations.length));
  writeGitHubOutput("warnings", String(result.warnings.length));
  writeGitHubOutput("decisions_checked", String(result.decisions_checked));

  // Exit with appropriate code
  if (result.status === "FAIL") {
    console.log("❌ COMPLIANCE FAILURE - Code violates meeting decisions");
    process.exit(1);
  } else if (result.status === "WARN" && config.FAIL_ON_WARN) {
    console.log("⚠️  COMPLIANCE WARNING (treated as failure)");
    process.exit(1);
  } else if (result.status === "WARN") {
    console.log("⚠️  COMPLIANCE WARNING - Review recommended");
    process.exit(0);
  } else if (result.status === "PASS") {
    console.log("✅ COMPLIANCE PASSED");
    process.exit(0);
  } else {
    console.log("❓ COMPLIANCE STATUS UNKNOWN");
    process.exit(0);
  }
}

/**
 * Format status with emoji for console output.
 */
function formatStatus(status: string): string {
  switch (status) {
    case "PASS":
      return "✅ PASS";
    case "WARN":
      return "⚠️  WARN";
    case "FAIL":
      return "❌ FAIL";
    default:
      return "❓ UNKNOWN";
  }
}

/**
 * Write a key-value pair to GITHUB_OUTPUT file.
 */
function writeGitHubOutput(key: string, value: string): void {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `${key}=${value}\n`);
  }
}

/**
 * Generate a fallback report when the agent fails.
 */
function generateFallbackReport(
  context: ComplianceContext,
  error: string,
): string {
  return `# 📋 Meeting Decision Compliance Report

**PR:** ${context.prTitle}
**Branch:** ${context.branch}
**Lookback Period:** ${context.lookbackDays} days
**Status:** ❓ UNKNOWN

## Summary

The compliance analysis could not be completed due to an error.

## Error Details

\`\`\`
${error}
\`\`\`

## Recommendations

1. Check that WorkIQ authentication is configured correctly
2. Verify the COPILOT_GITHUB_TOKEN secret is valid
3. Review the workflow logs for more details

---

<!-- COMPLIANCE_JSON_START -->
\`\`\`json
{
  "status": "UNKNOWN",
  "decisions_checked": 0,
  "violations": [],
  "warnings": [],
  "compliant_items": []
}
\`\`\`
<!-- COMPLIANCE_JSON_END -->
`;
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
