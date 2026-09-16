import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductOptions } from "../product-options";
import { getProductBySlug } from "@/lib/catalog";

describe("<ProductOptions />", () => {
  const product = getProductBySlug("contoso-classic-tee")!;

  it("renders option fieldsets and disables Add to Cart initially when required options are unselected", () => {
    render(<ProductOptions product={product} />);

    expect(
      screen.getByRole("button", { name: /select options to add to cart/i })
    ).toBeDisabled();

    // Status region
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toHaveTextContent(/please select size and color/i);
  });

  it("enables Add to Cart when valid options are selected and triggers onAddToCart callback", async () => {
    const user = userEvent.setup();
    const handleAddToCart = jest.fn();

    render(<ProductOptions product={product} onAddToCart={handleAddToCart} />);

    // Select Size M
    const sizeM = screen.getByRole("button", { name: /size medium \(m\)/i });
    await user.click(sizeM);

    // Select Color Navy
    const colorNavy = screen.getByRole("button", { name: /color navy/i });
    await user.click(colorNavy);

    const addToCartButton = screen.getByRole("button", { name: /add to cart/i });
    expect(addToCartButton).toBeEnabled();

    await user.click(addToCartButton);

    expect(handleAddToCart).toHaveBeenCalledTimes(1);
    expect(handleAddToCart).toHaveBeenCalledWith({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      variantId: "var-tee-m-navy",
      options: { size: "M", color: "Navy" },
      price: 29.99,
      quantity: 1,
    });

    // Status region announces addition
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toHaveTextContent(/added 1 x contoso classic logo tee/i);
  });

  it("disables Add to Cart and announces out of stock for unavailable combinations", async () => {
    const user = userEvent.setup();

    render(<ProductOptions product={product} />);

    // Select Size XL
    const sizeXL = screen.getByRole("button", { name: /size extra large \(xl\)/i });
    await user.click(sizeXL);

    // Select Color Navy (which is out of stock for XL)
    const colorNavy = screen.getByRole("button", { name: /color navy/i });
    await user.click(colorNavy);

    const addToCartButton = screen.getByRole("button", { name: /out of stock/i });
    expect(addToCartButton).toBeDisabled();

    // Status region announces out of stock
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toHaveTextContent(/selected combination is currently out of stock/i);
  });

  it("allows adjusting quantity", async () => {
    const user = userEvent.setup();

    render(<ProductOptions product={product} />);

    const increaseBtn = screen.getByRole("button", { name: /increase quantity/i });
    await user.click(increaseBtn);

    const quantityDisplay = screen.getByLabelText(/current quantity 2/i);
    expect(quantityDisplay).toBeInTheDocument();
  });
});
