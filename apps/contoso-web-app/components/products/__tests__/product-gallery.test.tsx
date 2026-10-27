import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGallery } from "../product-gallery";
import { getProductBySlug } from "@/lib/catalog";

describe("<ProductGallery />", () => {
  const product = getProductBySlug("contoso-classic-tee")!;

  it("renders main active image and thumbnail controls", () => {
    render(<ProductGallery images={product.images} title={product.title} />);

    // Main image
    const mainImg = screen.getByAltText(
      product.images[0]?.alt || product.title
    );
    expect(mainImg).toBeInTheDocument();

    // Thumbnails group
    const thumbnailsGroup = screen.getByRole("group", {
      name: /product image gallery thumbnails/i,
    });
    expect(thumbnailsGroup).toBeInTheDocument();

    const thumbnailButtons = screen.getAllByRole("button");
    expect(thumbnailButtons).toHaveLength(product.images.length);
    expect(thumbnailButtons[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("changes active image when thumbnail is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={product.images} title={product.title} />);

    const thumbnailButtons = screen.getAllByRole("button");
    const secondThumb = thumbnailButtons[1]!;

    await user.click(secondThumb);

    expect(secondThumb).toHaveAttribute("aria-pressed", "true");
    expect(thumbnailButtons[0]).toHaveAttribute("aria-pressed", "false");
  });
});
