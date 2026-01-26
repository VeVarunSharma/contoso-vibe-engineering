/**
 * Type definitions for the decision compliance analysis.
 */

/**
 * Severity levels for compliance issues.
 */
export type Severity = "FAIL" | "WARN";

/**
 * Overall compliance status.
 */
export type ComplianceStatus = "PASS" | "WARN" | "FAIL" | "UNKNOWN";

/**
 * A violation of a meeting decision.
 */
export interface Violation {
  decision_id: string;
  decision_summary: string;
  meeting_date: string;
  violation_type: string;
  severity: "FAIL";
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

/**
 * A warning about potential non-compliance.
 */
export interface Warning {
  decision_id: string;
  decision_summary: string;
  meeting_date: string;
  concern: string;
  severity: "WARN";
  recommendation: string;
}

/**
 * Evidence of compliance with a decision.
 */
export interface CompliantItem {
  decision_summary: string;
  status: "PASS";
  evidence: string;
}

/**
 * The structured compliance result from the agent.
 */
export interface ComplianceResult {
  status: ComplianceStatus;
  decisions_checked: number;
  violations: Violation[];
  warnings: Warning[];
  compliant_items: CompliantItem[];
}

/**
 * Context passed to the compliance agent.
 */
export interface ComplianceContext {
  repository: string;
  prNumber: string;
  prTitle: string;
  branch: string;
  keywords: string;
  lookbackDays: number;
  changedFiles: string[];
}

/**
 * Parse a compliance result from the agent's response.
 * Extracts the JSON block from the markdown report.
 */
export function parseComplianceResult(
  content: string,
): ComplianceResult | null {
  try {
    // Look for JSON block between markers
    const jsonMatch = content.match(
      /<!-- COMPLIANCE_JSON_START -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- COMPLIANCE_JSON_END -->/,
    );

    if (jsonMatch?.[1]) {
      return JSON.parse(jsonMatch[1]) as ComplianceResult;
    }

    // Fallback: try to find any JSON object with status field
    const fallbackMatch = content.match(
      /\{[^{}]*"status"\s*:\s*"(PASS|WARN|FAIL)"[^{}]*\}/,
    );

    if (fallbackMatch) {
      return JSON.parse(fallbackMatch[0]) as ComplianceResult;
    }

    return null;
  } catch (error) {
    console.error("Failed to parse compliance result:", error);
    return null;
  }
}

/**
 * Create a default/empty compliance result.
 */
export function createDefaultResult(): ComplianceResult {
  return {
    status: "UNKNOWN",
    decisions_checked: 0,
    violations: [],
    warnings: [],
    compliant_items: [],
  };
}
