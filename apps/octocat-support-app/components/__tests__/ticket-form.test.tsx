import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketForm } from "@/components/ticket-form";
import { SAMPLE_TICKET } from "@/lib/sample-ticket";
import { buildIssueDraft, formatDraftMarkdown } from "@/lib/ticket-draft";

const fetchMock = jest.fn<
  Promise<Pick<Response, "ok" | "json">>,
  [RequestInfo | URL, RequestInit?]
>();
const originalFetch = globalThis.fetch;

function mockPreview() {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      mode: "template-preview",
      draft: buildIssueDraft(SAMPLE_TICKET),
    }),
  });
}

describe("<TicketForm />", () => {
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

  it("renders a preview-first form with explicit default category and priority", () => {
    render(<TicketForm />);
    expect(screen.getByLabelText("Reporter name")).toBeInTheDocument();
    expect(screen.getByLabelText("Reporter email")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Description and evidence"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Review issue draft" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create GitHub issue" }),
    ).not.toBeInTheDocument();
  });

  it("focuses and associates inline validation errors without calling the API", async () => {
    const user = userEvent.setup();
    render(<TicketForm />);
    await user.click(
      screen.getByRole("button", { name: "Review issue draft" }),
    );
    const name = screen.getByLabelText("Reporter name");
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(
      "Name must be at least 2 characters",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    await user.type(name, "Demo Analyst");
    expect(name).toHaveAttribute("aria-invalid", "false");
  });

  it("prepares the synthetic sample without creating a GitHub issue and preserves it for editing", async () => {
    const user = userEvent.setup();
    mockPreview();
    render(<TicketForm />);
    await user.click(screen.getByRole("button", { name: "Use sample report" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Synthetic sample loaded",
    );
    await user.click(
      screen.getByRole("button", { name: "Review issue draft" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Review the issue draft" }),
    ).toHaveFocus();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/tickets/preview");
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual(
      SAMPLE_TICKET,
    );
    expect(screen.getByLabelText("Issue body")).toHaveTextContent("DEMO-1042");
    await user.click(screen.getByRole("button", { name: "Edit report" }));
    expect(screen.getByLabelText("Subject")).toHaveValue(SAMPLE_TICKET.subject);
    expect(screen.getByLabelText("Description and evidence")).toHaveValue(
      SAMPLE_TICKET.description,
    );
  });

  it("keeps the report on a network failure and supports an explicit retry", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    mockPreview();
    render(<TicketForm />);
    await user.click(screen.getByRole("button", { name: "Use sample report" }));
    await user.click(
      screen.getByRole("button", { name: "Review issue draft" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Check your connection",
    );
    expect(screen.getByLabelText("Description and evidence")).toHaveValue(
      SAMPLE_TICKET.description,
    );
    await user.click(
      screen.getByRole("button", { name: "Review issue draft" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Review the issue draft" }),
    ).toBeInTheDocument();
  });

  it("rejects a success-shaped response that has no draft", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });
    render(<TicketForm />);
    await user.click(screen.getByRole("button", { name: "Use sample report" }));
    await user.click(
      screen.getByRole("button", { name: "Review issue draft" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid draft");
    expect(
      screen.queryByRole("button", { name: "Download handoff" }),
    ).not.toBeInTheDocument();
  });

  it("disables input during the preview request", async () => {
    const user = userEvent.setup();
    let finish: ((value: Pick<Response, "ok" | "json">) => void) | undefined;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<TicketForm />);
    await user.click(screen.getByRole("button", { name: "Use sample report" }));
    await user.click(
      screen.getByRole("button", { name: "Review issue draft" }),
    );
    expect(
      screen.getByRole("button", { name: "Preparing template draft..." }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Subject")).toBeDisabled();
    finish?.({
      ok: false,
      json: async () => ({ success: false, error: "Please retry." }),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Please retry");
    expect(
      screen.getByRole("button", { name: "Review issue draft" }),
    ).toBeEnabled();
  });

  it("copies the real Markdown handoff and can reset the rehearsal", async () => {
    const user = userEvent.setup();
    const copy = jest
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    mockPreview();
    render(<TicketForm />);
    await user.click(screen.getByRole("button", { name: "Use sample report" }));
    await user.click(
      screen.getByRole("button", { name: "Review issue draft" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Copy Markdown" }),
    );
    expect(copy).toHaveBeenCalledWith(
      formatDraftMarkdown(buildIssueDraft(SAMPLE_TICKET)),
    );
    expect(
      await screen.findByRole("heading", { name: "Your handoff is ready" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nothing was sent to GitHub",
    );
    await user.click(
      screen.getByRole("button", { name: "Start another report" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Subject")).toHaveValue(""),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
