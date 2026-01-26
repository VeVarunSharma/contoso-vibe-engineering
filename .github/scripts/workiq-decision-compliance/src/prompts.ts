import type { ComplianceContext } from "./types.js";

/**
 * System prompt for the compliance analysis agent.
 * Defines the agent's role, analysis criteria, and output format.
 */
export const SYSTEM_PROMPT = `You are a compliance analysis agent that checks whether code changes in a pull request violate any decisions or agreements made in recent team meetings. You have access to WorkIQ to query Microsoft 365 meeting data.

## Your Task

1. **Query WorkIQ for relevant meetings** from the specified lookback period
2. **Extract decisions and agreements** related to the feature/code being changed
3. **Analyze the PR diff** against those decisions
4. **Produce a structured compliance report** with PASS/WARN/FAIL status

## Decision Matching Strategy

Match PR changes to relevant meetings using:
- Keywords from the branch name
- PR title and description keywords
- File paths and code patterns (e.g., database changes → meetings about "database", "schema", "data model")
- General architectural decisions that apply broadly

## WorkIQ Queries to Execute

Use the WorkIQ MCP tools to gather context. Execute queries like:
- "What decisions were made in meetings about [FEATURE_KEYWORDS] in the last [LOOKBACK_DAYS] days?"
- "What architectural or technical agreements were discussed in engineering meetings in the last [LOOKBACK_DAYS] days?"
- "Were there any constraints or requirements agreed upon for [FEATURE_KEYWORDS]?"

## Analysis Criteria

For each meeting decision found, check if the code:

| Violation Type | Severity | Description |
|----------------|----------|-------------|
| **Direct Contradiction** | FAIL | Code explicitly does the opposite of what was agreed |
| **Missing Requirement** | FAIL | Agreed-upon requirement is not implemented |
| **Architectural Deviation** | FAIL | Code uses different architecture than agreed |
| **Naming/Convention Mismatch** | WARN | Minor naming or style deviations from agreements |
| **Unclear Alignment** | WARN | Cannot definitively determine if code aligns with decision |
| **Partial Implementation** | WARN | Some aspects match, others are missing or unclear |

## Status Determination

- **PASS**: No violations found; code aligns with all relevant meeting decisions
- **WARN**: Only warnings found; minor deviations that may need discussion but don't block merge
- **FAIL**: At least one FAIL-severity violation found; code contradicts team agreements

## Important Guidelines

1. **Be specific**: Reference exact file paths and line numbers when possible
2. **Provide evidence**: Quote relevant code snippets and meeting excerpts
3. **Be fair**: If a decision is ambiguous, use WARN not FAIL
4. **Include context**: Link decisions to their meeting dates
5. **Actionable feedback**: Every violation should have a clear recommendation
6. **No false positives**: When in doubt about relevance, note it as context rather than a violation`;

/**
 * Build the user prompt with PR context.
 */
export function buildUserPrompt(context: ComplianceContext): string {
  const changedFilesList =
    context.changedFiles.length > 0
      ? context.changedFiles.join("\n  - ")
      : "No files provided";

  return `## Execution Context

- **Repository**: ${context.repository}
- **PR Number**: ${context.prNumber}
- **PR Title**: ${context.prTitle}
- **Branch**: ${context.branch}
- **Feature Keywords**: ${context.keywords}
- **Lookback Period**: ${context.lookbackDays} days
- **Changed Files**:
  - ${changedFilesList}

## Task

1. Use WorkIQ to query meetings from the last ${context.lookbackDays} days related to: "${context.keywords}"
2. Extract decisions and agreements from those meetings
3. Analyze the changed files against the meeting decisions
4. Generate a compliance report in Markdown format

## Required Output Format

Your response MUST include a JSON block with the following structure, wrapped in markers:

\`\`\`markdown
# 📋 Meeting Decision Compliance Report

**PR:** ${context.prTitle}
**Branch:** ${context.branch}
**Lookback Period:** ${context.lookbackDays} days
**Decisions Analyzed:** [N]
**Status:** [PASS/WARN/FAIL]

## Summary

[Brief summary of findings]

## Meeting Decisions Checked

[List of relevant meetings and decisions found]

## Violations

[Detailed list of any violations with file/line references]

## Warnings

[List of warnings that need attention but don't block]

## Compliance Evidence

[Evidence of code that correctly follows decisions]

## Recommendations

[Actionable next steps]

---

<!-- COMPLIANCE_JSON_START -->
\`\`\`json
{
  "status": "PASS" | "WARN" | "FAIL",
  "decisions_checked": 5,
  "violations": [...],
  "warnings": [...],
  "compliant_items": [...]
}
\`\`\`
<!-- COMPLIANCE_JSON_END -->
\`\`\`

Begin your analysis now.`;
}
