import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SiteHeader } from "@/components/site-header";

jest.mock("next/link", () => {
  return {
    __esModule: true,
    default: function MockLink({
      children,
      href,
      ...rest
    }: { children: React.ReactNode; href: string }) {
      return React.createElement("a", { href, ...rest }, children);
    },
  };
});

describe("<SiteHeader />", () => {
  beforeEach(() => render(<SiteHeader />));

  it("renders the brand link to home", () => {
    expect(screen.getByText(/contoso distribution/i)).toBeInTheDocument();
  });

  it("renders catalog, distribution, and compliance navigation", () => {
    expect(screen.getByRole("link", { name: /^catalog$/i })).toHaveAttribute(
      "href",
      "#catalog",
    );
    expect(screen.getByRole("link", { name: /^distribution$/i })).toHaveAttribute(
      "href",
      "#distribution",
    );
    expect(screen.getByRole("link", { name: /compliance/i })).toHaveAttribute(
      "href",
      "#compliance",
    );
  });

  it("links the retailer catalog action to the catalog", () => {
    expect(
      screen.getByRole("link", { name: /retailer catalog/i }),
    ).toHaveAttribute("href", "#catalog");
  });

  it("toggles the mobile navigation", async () => {
    const user = userEvent.setup();
    const menu = screen.getByRole("button", { name: /open navigation/i });

    expect(menu).toHaveAttribute("aria-expanded", "false");
    await user.click(menu);
    expect(
      screen.getByRole("button", { name: /close navigation/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("uses a semantic <header> element", () => {
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});
