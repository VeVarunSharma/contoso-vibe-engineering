import type { ToolUpdate } from "./types.js";

interface SummaryOptions {
  maxItems?: number;
  includeRaw?: boolean;
}

export interface DigestContent {
  subject: string;
  htmlBody: string;
  textBody: string;
}

const SOURCE_LABELS: Record<ToolUpdate["source"], string> = {
  copilot: "GitHub Copilot",
  claude: "Claude Code",
  cursor: "Cursor",
};

export function buildDigestContent(
  updates: ToolUpdate[],
  options: SummaryOptions = {}
): DigestContent {
  const { maxItems = 9, includeRaw = false } = options;
  const selected = updates.slice(0, maxItems);

  const sections = selected.map((update) => {
    const label = SOURCE_LABELS[update.source];
    const bullet = `✅ <strong>${label}:</strong> <a href="${update.link}">${update.title}</a>`;
    const context = includeRaw ? `<p>${update.summary}</p>` : "";
    const recommendedAction = deriveAction(update.source);

    return `<li>${bullet}<br/><em>${formatDate(update.publishedAt)}</em><br/>${recommendedAction}${context}</li>`;
  });

  const htmlBody = `
    <h2>AI Solution Engineering Digest</h2>
    <p>Curated highlights for customer adoption of GitHub Copilot and adjacent AI tooling.</p>
    <ul>
      ${sections.join("\n")}
    </ul>
    <p>If you have pilot insights to share, reply-all so the team can amplify.</p>
  `;

  const textSections = selected.map((update) => {
    const label = SOURCE_LABELS[update.source];
    const action = deriveAction(update.source);
    return `- ${label}: ${update.title} (${formatDate(update.publishedAt)})\n  Link: ${update.link}\n  Action: ${stripHtml(action)}`;
  });

  const textBody = `AI Solution Engineering Digest\n\n${textSections.join("\n\n")}`;

  const subject = `Weekly AI Tool Digest (${formatDate(new Date())})`;

  return { subject, htmlBody, textBody };
}

function deriveAction(source: ToolUpdate["source"]): string {
  switch (source) {
    case "copilot":
      return "<strong>Action:</strong> Share with enterprise customers evaluating GitHub Copilot adoption plans.";
    case "claude":
      return "<strong>Action:</strong> Highlight complementary workflows when positioning multi-agent coding strategies.";
    case "cursor":
      return "<strong>Action:</strong> Compare pair-programming telemetry to Copilot pair suggestions in discovery calls.";
    default:
      return "<strong>Action:</strong> Review with the team.";
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>?/gm, "");
}
