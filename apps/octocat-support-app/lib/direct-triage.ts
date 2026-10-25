import type { TicketFormData, TicketResponse } from "@/lib/types";
import { buildIssueDraft } from "@/lib/ticket-draft";

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
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
  const { title, body, labels } = buildIssueDraft(ticket);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
      {
        method: "POST",
        signal: AbortSignal.timeout(15000),
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
        error: `GitHub rejected the request (HTTP ${response.status}). Ask the administrator to check repository access and issue permissions.`,
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
        "GitHub did not confirm creation. Check the repository for an issue before retrying to avoid duplicates. Your local draft is still available.",
    };
  }
}
