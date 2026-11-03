import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProductCatalog } from "@/components/landing/product-catalog";

describe("<ProductCatalog />", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders liquor and cannabis products", () => {
    render(<ProductCatalog />);

    expect(
      screen.getByRole("heading", { name: /contoso reserve bourbon/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /premium cannabis flower.*mary jane/i }),
    ).toBeInTheDocument();
  });

  it("filters the catalog by category", async () => {
    const user = userEvent.setup();
    render(<ProductCatalog />);

    await user.click(screen.getByRole("button", { name: /cannabis/i }));

    expect(
      screen.queryByRole("heading", { name: /contoso reserve bourbon/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /premium cannabis flower.*mary jane/i }),
    ).toBeInTheDocument();
  });

  it("searches products by SKU and reports empty results", async () => {
    const user = userEvent.setup();
    render(<ProductCatalog />);
    const search = screen.getByRole("searchbox", { name: /search products/i });

    await user.type(search, "CB-EDB-508");
    expect(
      screen.getByRole("heading", { name: /berry balance gummies/i }),
    ).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "not a product");
    expect(
      screen.getByText(/no products match your search/i),
    ).toBeInTheDocument();
  });

  it("generates a shelf tag with product details", async () => {
    const user = userEvent.setup();
    const print = jest.spyOn(window, "print").mockImplementation(() => {});
    render(<ProductCatalog />);

    await user.click(
      screen.getAllByRole("button", { name: /generate shelf tag/i })[0]!,
    );

    expect(screen.getByText(/shelf tag ready/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/printable shelf tag/i),
    ).toHaveTextContent(/SKU: LQ-BBN-104/);
    await user.click(screen.getByRole("button", { name: /print shelf tag/i }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/tag generated/i)).toBeDisabled();
  });
});
