import type { TicketFormData, TicketResponse } from "@/lib/types";
import { escapeMarkdown } from "@/lib/escape";

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

/**
 * Category-to-label mapping for GitHub issues.
 */
const CATEGORY_LABELS: Record<string, string> = {
  bug: "bug",
  feature: "enhancement",
  question: "question",
  docs: "documentation",
  security: "security",
};

/**
 * Category-to-title prefix mapping.
 */
const CATEGORY_PREFIX: Record<string, string> = {
  bug: "[Bug]",
  feature: "[Feature]",
  question: "[Question]",
  docs: "[Docs]",
  security: "[Security]",
};

/**
 * Generates a structured issue body based on ticket category.
 */
function generateIssueBody(ticket: TicketFormData): string {
  const { category, description } = ticket;
  const name = escapeMarkdown(ticket.name);
  const email = ticket.email.replace(/[\r\n]+/g, " ");
  const subject = escapeMarkdown(ticket.subject);
  const priority = escapeMarkdown(ticket.priority);

  switch (category) {
    case "bug":
      return [
        "## Description",
        description,
        "",
        "## Steps to Reproduce",
        "*(Please clarify steps if not detailed above)*",
        "",
        "## Expected Behavior",
        "*(To be clarified by reporter)*",
        "",
        "## Actual Behavior",
        `As described: ${subject}`,
        "",
        "## Reporter",
        `- **Name:** ${name}`,
        `- **Email:** ${email}`,
        "",
        "## Additional Context",
        `Submitted via Octocat Support Portal.`,
      ].join("\n");

    case "feature":
      return [
        "## Summary",
        description,
        "",
        "## Motivation",
        `Feature requested by ${name} to improve the product experience.`,
        "",
        "## Proposed Solution",
        "*(To be discussed and refined by the team)*",
        "",
        "## Acceptance Criteria",
        "- [ ] Implementation matches the described requirements",
        "- [ ] Tests are added for new functionality",
        "- [ ] Documentation is updated",
        "",
        "## Reporter",
        `- **Name:** ${name}`,
        `- **Email:** ${email}`,
      ].join("\n");

    case "security":
      return [
        "## Summary",
        description,
        "",
        "## Severity Assessment",
        `Priority: ${priority}`,
        "",
        "## Reporter",
        `- **Name:** ${name}`,
        `- **Email:** ${email}`,
        "",
        "## Recommended Next Steps",
        "- [ ] Investigate the reported concern",
        "- [ ] Assess impact and affected systems",
        "- [ ] Determine if a private security advisory is needed",
      ].join("\n");

    default:
      // question, docs, or any other
      return [
        "## Summary",
        description,
        "",
        "## Details",
        `Subject: ${subject}`,
        "",
        "## Reporter",
        `- **Name:** ${name}`,
        `- **Email:** ${email}`,
        "",
        "## Expected Outcome",
        "*(Awaiting clarification or resolution)*",
      ].join("\n");
  }
}

/**
 * Creates a GitHub issue directly using the REST API with structured
 * template-based triage (no Copilot SDK dependency).
 *
 * This serves as the primary path for issue creation, applying the same
 * triage rules defined in the ticket-creation skill.
 */
export async function triageAndCreateIssueDirect(
  ticket: TicketFormData,
  config: GitHubConfig,
): Promise<TicketResponse> {
  const prefix = CATEGORY_PREFIX[ticket.category] ?? "[Support]";
  const title = `${prefix} ${ticket.subject}`.slice(0, 72);

  const body = generateIssueBody(ticket);

  const labels: string[] = [];

  // Add category label
  const categoryLabel = CATEGORY_LABELS[ticket.category];
  if (categoryLabel) {
    labels.push(categoryLabel);
  }

  // Add priority label
  labels.push(`priority:${ticket.priority}`);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body, labels }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`GitHub API error (${response.status}):`, errorBody);
      return {
        success: false,
        error: `Failed to create GitHub issue (HTTP ${response.status}). Please try again.`,
      };
    }

    const issue = await response.json();
    return {
      success: true,
      issueUrl: issue.html_url,
      issueNumber: issue.number,
      title: issue.title,
      labels: issue.labels?.map((l: { name: string }) => l.name) ?? labels,
    };
  } catch (error) {
    console.error("GitHub API request failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? `GitHub API error: ${error.message}`
          : "Failed to communicate with GitHub. Please try again.",
    };
  }
}
