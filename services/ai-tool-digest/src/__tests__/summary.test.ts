import { buildDigestContent } from "../summary.js";
import type { ToolUpdate } from "../types.js";

describe("buildDigestContent", () => {
  const updates: ToolUpdate[] = [
    {
      source: "copilot",
      title: "GitHub Copilot adds inline rationale",
      link: "https://github.blog/changelog/2025-11-15-inline-rationale",
      publishedAt: new Date("2025-11-15T00:00:00Z"),
      summary: "Copilot now describes decisions inline.",
      tags: ["Copilot", "Changelog"],
    },
    {
      source: "claude",
      title: "Claude Code introduces refactor playbooks",
      link: "https://www.anthropic.com/news/claude-code-playbooks",
      publishedAt: new Date("2025-11-18T00:00:00Z"),
      summary: "Automated refactor checklists from Claude.",
      tags: ["Claude"],
    },
  ];

  it("creates html and text bodies with actions", () => {
    const digest = buildDigestContent(updates, { includeRaw: false });

    expect(digest.subject).toMatch(/Weekly AI Tool Digest/);
    expect(digest.htmlBody).toContain("GitHub Copilot");
    expect(digest.textBody).toContain("Claude Code");
    expect(digest.textBody).toContain("Action");
  });
});
