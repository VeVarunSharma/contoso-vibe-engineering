import { escapeMarkdown } from "@/lib/escape";
import type { IssueDraft, TicketFormData } from "@/lib/types";

const CATEGORY_LABELS: Record<TicketFormData["category"], string> = {
  bug: "bug",
  feature: "enhancement",
  question: "question",
  docs: "documentation",
  security: "security",
};

const CATEGORY_PREFIX: Record<TicketFormData["category"], string> = {
  bug: "[Bug]",
  feature: "[Feature]",
  question: "[Question]",
  docs: "[Docs]",
  security: "[Security]",
};

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
        "Submitted via Octocat Support Portal.",
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
        `Priority: ${priority} (reporter-selected, not independently assessed)`,
        "",
        "## Reporter",
        `- **Name:** ${name}`,
        `- **Email:** ${email}`,
        "",
        "## Recommended Next Steps",
        "- [ ] Share only through an approved private security channel",
        "- [ ] Investigate the reported concern",
        "- [ ] Assess impact and affected systems",
      ].join("\n");
    default:
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

export function buildIssueDraft(ticket: TicketFormData): IssueDraft {
  return {
    title: `${CATEGORY_PREFIX[ticket.category]} ${ticket.subject}`.slice(0, 72),
    body: generateIssueBody(ticket),
    labels: [CATEGORY_LABELS[ticket.category], `priority:${ticket.priority}`],
  };
}

export function formatDraftMarkdown(draft: IssueDraft): string {
  return [
    `# ${draft.title}`,
    "",
    "> Template preview from Octocat Support. No GitHub issue has been created.",
    "> Category and priority are reporter-selected, not independently verified.",
    "",
    `Suggested labels: ${draft.labels.map((label) => `\`${label}\``).join(", ")}`,
    "",
    draft.body,
    "",
    "## Before engineering handoff",
    "- [ ] Confirm reproduction steps and expected behavior",
    "- [ ] Verify impact and priority with the support lead",
    "- [ ] Remove sensitive data and choose an engineering owner",
    "",
  ].join("\n");
}
