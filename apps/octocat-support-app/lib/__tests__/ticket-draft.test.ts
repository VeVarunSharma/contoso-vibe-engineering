import { SAMPLE_TICKET } from "@/lib/sample-ticket";
import { buildIssueDraft, formatDraftMarkdown } from "@/lib/ticket-draft";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  ticketFormSchema,
} from "@/lib/types";

describe("template handoff", () => {
  it("ships a valid synthetic report", () => {
    expect(ticketFormSchema.parse(SAMPLE_TICKET)).toEqual(SAMPLE_TICKET);
    expect(SAMPLE_TICKET.email).toMatch(/@example\.test$/);
  });

  it.each(TICKET_CATEGORIES)(
    "preserves the report and maps the $value category",
    ({ value }) => {
      const ticket = { ...SAMPLE_TICKET, category: value };
      const draft = buildIssueDraft(ticket);
      expect(draft.body).toContain(ticket.description);
      expect(draft.body).toContain(ticket.email);
      expect(draft.labels[0]).toBe(
        value === "feature"
          ? "enhancement"
          : value === "docs"
            ? "documentation"
            : value,
      );
      expect(buildIssueDraft(ticket)).toEqual(draft);
    },
  );

  it.each(TICKET_PRIORITIES)(
    "retains reporter-selected $value priority without inference",
    ({ value }) => {
      expect(
        buildIssueDraft({ ...SAMPLE_TICKET, priority: value }).labels,
      ).toContain(`priority:${value}`);
    },
  );

  it("keeps the existing 72-character title limit", () => {
    expect(
      buildIssueDraft({ ...SAMPLE_TICKET, subject: "a".repeat(120) }).title,
    ).toHaveLength(72);
  });

  it("preserves identifier escaping and renders Markdown as data", () => {
    const draft = buildIssueDraft({
      ...SAMPLE_TICKET,
      name: "<script>example</script>",
      subject: "A subject\n## Forged heading",
    });
    expect(draft.body).not.toContain("<script>");
    expect(draft.body).toContain("&lt;script&gt;");
    expect(draft.body).not.toContain("\n## Forged heading");
  });

  it("exports provenance, full report and review checks, not a fake created issue", () => {
    const draft = buildIssueDraft(SAMPLE_TICKET);
    const markdown = formatDraftMarkdown(draft);
    expect(markdown).toContain(`# ${draft.title}`);
    expect(markdown).toContain("No GitHub issue has been created");
    expect(markdown).toContain("not independently verified");
    expect(markdown).toContain(draft.body);
    expect(markdown).toContain("- [ ] Verify impact");
    expect(markdown).not.toMatch(/https:\/\/github\.com\/.*\/issues\/\d+/);
  });
});
