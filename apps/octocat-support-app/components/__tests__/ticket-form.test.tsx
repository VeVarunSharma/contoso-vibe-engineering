import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TicketForm } from "@/components/ticket-form";

describe("<TicketForm />", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    delete (globalThis as unknown as { fetch?: typeof fetch }).fetch;
    jest.restoreAllMocks();
  });

  it("renders the required fields", () => {
    render(<TicketForm />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create support ticket|submit/i }),
    ).toBeInTheDocument();
  });

  it("shows inline validation errors on empty submit and never calls fetch", async () => {
    const user = userEvent.setup();
    render(<TicketForm />);

    await user.click(
      screen.getByRole("button", { name: /create support ticket|submit/i }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });
    expect(screen.getByLabelText(/email/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears the field error after the user starts typing", async () => {
    const user = userEvent.setup();
    render(<TicketForm />);

    await user.click(
      screen.getByRole("button", { name: /create support ticket|submit/i }),
    );

    const nameInput = screen.getByLabelText(/name/i);
    await waitFor(() =>
      expect(nameInput).toHaveAttribute("aria-invalid", "true"),
    );

    await user.type(nameInput, "Alice");
    await waitFor(() =>
      expect(nameInput).not.toHaveAttribute("aria-invalid", "true"),
    );
  });
});
