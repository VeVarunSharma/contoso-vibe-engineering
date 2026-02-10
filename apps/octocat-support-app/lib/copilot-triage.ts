import { TICKET_TRIAGE_SYSTEM_PROMPT } from "@/lib/prompts";
import type { TicketFormData, TicketResponse } from "@/lib/types";
import { CopilotClient, defineTool } from "@github/copilot-sdk";

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

interface GitHubIssueResult {
  issueUrl: string;
  issueNumber: number;
  title: string;
  labels: string[];
}

/**
 * Creates a GitHub issue via the REST API.
 */
async function createGitHubIssue(
  config: GitHubConfig,
  title: string,
  body: string,
  labels: string[],
): Promise<GitHubIssueResult> {
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
    throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
  }

  const issue = await response.json();
  return {
    issueUrl: issue.html_url,
    issueNumber: issue.number,
    title: issue.title,
    labels: issue.labels?.map((l: { name: string }) => l.name) ?? [],
  };
}

/**
 * Uses the GitHub Copilot SDK to triage a support ticket and create a GitHub issue.
 *
 * Flow:
 * 1. Initialize CopilotClient
 * 2. Create a session with the triage system prompt and a custom `create_github_issue` tool
 * 3. Send the user's raw ticket as a message
 * 4. The model triages the ticket and calls the tool, which creates the GitHub issue
 * 5. Return the issue URL, number, title, and labels
 */
export async function triageAndCreateIssue(
  ticket: TicketFormData,
  config: GitHubConfig,
): Promise<TicketResponse> {
  let issueResult: GitHubIssueResult | null = null;
  let toolError: string | null = null;

  interface IssueParams {
    title: string;
    body: string;
    labels: string[];
  }

  const client = new CopilotClient();
  try {
    await client.start();

    const session = await client.createSession({
      model: "gpt-4o",
      systemMessage: {
        mode: "append",
        content: TICKET_TRIAGE_SYSTEM_PROMPT,
      },
      tools: [
        defineTool<IssueParams>("create_github_issue", {
          description:
            "Creates a GitHub issue from a triaged support ticket. Call this tool with the structured title, body, and labels after analyzing the user's support ticket.",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description:
                  "The issue title with type prefix, e.g. '[Bug] Login fails with SSO enabled'",
              },
              body: {
                type: "string",
                description:
                  "The full markdown body of the issue using the appropriate template",
              },
              labels: {
                type: "array",
                items: { type: "string" },
                description:
                  "Array of label strings, e.g. ['bug', 'priority:high']",
              },
            },
            required: ["title", "body", "labels"],
          },
          handler: async (args: IssueParams) => {
            try {
              issueResult = await createGitHubIssue(
                config,
                args.title,
                args.body,
                args.labels,
              );
              return {
                textResultForLlm: `Issue #${issueResult.issueNumber} created successfully: ${issueResult.issueUrl}`,
                resultType: "success" as const,
              };
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Unknown error creating issue";
              toolError = message;
              return {
                textResultForLlm: `Failed to create issue: ${message}`,
                resultType: "failure" as const,
                error: message,
              };
            }
          },
        }),
      ],
    });

    try {
      // Compose the user message with all ticket context
      const userMessage = [
        `New support ticket submitted:`,
        ``,
        `- **Reporter Name:** ${ticket.name}`,
        `- **Reporter Email:** ${ticket.email}`,
        `- **Category:** ${ticket.category}`,
        `- **Priority:** ${ticket.priority}`,
        `- **Subject:** ${ticket.subject}`,
        ``,
        `**Description:**`,
        ticket.description,
      ].join("\n");

      // Send and wait for the model to process and call the tool
      await session.sendAndWait({ prompt: userMessage }, 60000);

      // Check results
      if (toolError) {
        return {
          success: false,
          error: `Failed to create GitHub issue: ${toolError}`,
        };
      }

      if (!issueResult) {
        return {
          success: false,
          error:
            "The AI triage agent did not create an issue. Please try again.",
        };
      }

      const createdIssue: GitHubIssueResult = issueResult;
      return {
        success: true,
        issueUrl: createdIssue.issueUrl,
        issueNumber: createdIssue.issueNumber,
        title: createdIssue.title,
        labels: createdIssue.labels,
      };
    } finally {
      await session.destroy();
    }
  } finally {
    await client.stop();
  }
}
