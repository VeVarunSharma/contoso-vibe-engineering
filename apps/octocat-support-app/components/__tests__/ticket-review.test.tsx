import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketReview } from "@/components/ticket-review";
import { SAMPLE_TICKET } from "@/lib/sample-ticket";
import { buildIssueDraft } from "@/lib/ticket-draft";

const props = {
  ticket: SAMPLE_TICKET,
  draft: buildIssueDraft(SAMPLE_TICKET),
  complete: false,
  onComplete: jest.fn(),
  onEdit: jest.fn(),
  onReset: jest.fn(),
};

const fetchMock = jest.fn<
  Promise<Pick<Response, "ok" | "json">>,
  [RequestInfo | URL, RequestInit?]
>();
const originalFetch = globalThis.fetch;

describe("<TicketReview />", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("requires explicit consent before live publishing and prevents resubmission after confirmation", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        issueNumber: 42,
        issueUrl: "https://github.com/example/support/issues/42",
        title: props.draft.title,
        labels: props.draft.labels,
      }),
    });
    render(
      <TicketReview
        {...props}
        publishing={{ mode: "direct", repository: "example/support" }}
      />,
    );
    const create = screen.getByRole("button", { name: "Create GitHub issue" });
    expect(create).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(create);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tickets",
      expect.objectContaining({
        body: JSON.stringify({ ...SAMPLE_TICKET, confirmSubmission: true }),
      }),
    );
    expect(
      await screen.findByRole("link", { name: "View issue #42" }),
    ).toHaveAttribute("href", "https://github.com/example/support/issues/42");
    expect(
      screen.queryByRole("button", { name: "Create GitHub issue" }),
    ).not.toBeInTheDocument();
    expect(props.onComplete).toHaveBeenCalledTimes(1);
  });

  it("discloses that optional AI triage may change the template draft", () => {
    render(
      <TicketReview
        {...props}
        publishing={{ mode: "copilot", repository: "example/support" }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "AI can change the title, body, and labels",
    );
    expect(
      screen.getByRole("button", { name: "Run AI triage & create issue" }),
    ).toBeDisabled();
  });

  it("keeps exports available when live configuration is unavailable", () => {
    render(
      <TicketReview
        {...props}
        publishing={{
          mode: "unavailable",
          reason: "Live publishing needs GITHUB_TOKEN.",
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("GITHUB_TOKEN");
    expect(
      screen.getByRole("button", { name: "Download handoff" }),
    ).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not offer public issue creation for a security report", () => {
    render(
      <TicketReview
        {...props}
        ticket={{ ...SAMPLE_TICKET, category: "security" }}
        publishing={{ mode: "direct", repository: "example/support" }}
      />,
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "private security channel",
    );
  });

  it("reports clipboard failure without claiming completion", async () => {
    const user = userEvent.setup();
    jest
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValueOnce(new Error("denied"));
    render(<TicketReview {...props} publishing={{ mode: "preview" }} />);
    await user.click(screen.getByRole("button", { name: "Copy Markdown" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Download the Markdown handoff instead",
    );
    expect(props.onComplete).not.toHaveBeenCalled();
  });

  it("preserves the draft on an ambiguous publish failure and never retries automatically", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    render(
      <TicketReview
        {...props}
        publishing={{ mode: "direct", repository: "example/support" }}
      />,
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Create GitHub issue" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Check the repository before retrying",
    );
    expect(
      screen.getByRole("button", { name: "Download handoff" }),
    ).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(props.onComplete).not.toHaveBeenCalled();
  });
});
