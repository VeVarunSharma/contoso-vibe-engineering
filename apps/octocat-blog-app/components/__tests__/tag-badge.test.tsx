import React from "react";
import { render, screen } from "@testing-library/react";
import { TagBadge } from "@/components/tag-badge";
import type { Tag } from "@/src/db/schema";

const mockTag: Tag = {
  id: 1,
  name: "GitHub Actions",
  slug: "github-actions",
  createdAt: new Date("2025-01-01"),
};

describe("TagBadge", () => {
  it("renders the tag name", () => {
    render(<TagBadge tag={mockTag} />);
    expect(screen.getByText("GitHub Actions")).toBeInTheDocument();
  });

  it("links to the correct tag page", () => {
    render(<TagBadge tag={mockTag} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/tag/github-actions");
  });

  it("applies correct styling classes", () => {
    render(<TagBadge tag={mockTag} />);
    const link = screen.getByRole("link");
    expect(link).toHaveClass(
      "inline-flex",
      "items-center",
      "gap-1",
      "rounded-full",
      "bg-muted"
    );
  });

  it("renders with different tag names", () => {
    const aiTag: Tag = {
      id: 2,
      name: "AI",
      slug: "ai",
      createdAt: new Date("2025-01-01"),
    };
    render(<TagBadge tag={aiTag} />);
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tag/ai");
  });
});
