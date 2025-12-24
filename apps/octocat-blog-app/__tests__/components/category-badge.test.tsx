import React from "react";
import { render, screen } from "@testing-library/react";
import { CategoryBadge } from "@/components/category-badge";
import type { Category } from "@/src/db/schema";

const mockCategory: Category = {
  id: 1,
  name: "Releases",
  slug: "releases",
  description: "New GitHub releases and version updates",
  color: "#238636",
  createdAt: new Date("2025-01-01"),
};

describe("CategoryBadge", () => {
  it("renders the category name", () => {
    render(<CategoryBadge category={mockCategory} />);
    expect(screen.getByText("Releases")).toBeInTheDocument();
  });

  it("links to the correct category page", () => {
    render(<CategoryBadge category={mockCategory} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/category/releases");
  });

  it("applies custom background color from category", () => {
    render(<CategoryBadge category={mockCategory} />);
    const link = screen.getByRole("link");
    expect(link).toHaveStyle({ backgroundColor: "#238636" });
  });

  it("uses default color when category color is null", () => {
    const categoryWithoutColor: Category = {
      ...mockCategory,
      color: null,
    };
    render(<CategoryBadge category={categoryWithoutColor} />);
    const link = screen.getByRole("link");
    expect(link).toHaveStyle({ backgroundColor: "#24292f" });
  });

  describe("Size variants", () => {
    it("renders small size by default", () => {
      render(<CategoryBadge category={mockCategory} />);
      const link = screen.getByRole("link");
      expect(link).toHaveClass("px-2.5", "py-0.5", "text-xs");
    });

    it('renders small size when size="sm"', () => {
      render(<CategoryBadge category={mockCategory} size="sm" />);
      const link = screen.getByRole("link");
      expect(link).toHaveClass("px-2.5", "py-0.5", "text-xs");
    });

    it('renders medium size when size="md"', () => {
      render(<CategoryBadge category={mockCategory} size="md" />);
      const link = screen.getByRole("link");
      expect(link).toHaveClass("px-3", "py-1", "text-sm");
    });
  });
});
