import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EngagementSection } from "@/components/engagement-section";

const fetchMock = jest.fn();

describe("EngagementSection", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reactions: { like: 0, love: 0, celebrate: 0 },
        }),
      });
  });

  it("renders an accessible comment form and reaction controls", async () => {
    render(<EngagementSection slug="test-post" />);

    expect(screen.getByLabelText("Display name")).toBeRequired();
    expect(screen.getByLabelText("Comment")).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Like, 0 reactions" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Be the first to comment."),
    ).toBeInTheDocument();
  });

  it("adds a comment and moves focus to the success status", async () => {
    render(<EngagementSection slug="test-post" />);
    await screen.findByRole("button", { name: "Post comment" });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        comment: {
          id: 1,
          displayName: "Reader",
          content: "Great post!",
          createdAt: "2026-09-10T12:00:00.000Z",
        },
      }),
    });

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Reader" },
    });
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "Great post!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Your comment was added.");
    await waitFor(() => expect(status).toHaveFocus());
    expect(screen.getByText("Great post!")).toBeInTheDocument();
  });
});
