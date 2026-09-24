import * as React from "react";
import { render, screen } from "@testing-library/react";

import { HeroSection } from "@/components/landing/hero-section";

describe("<HeroSection />", () => {
  beforeEach(() => render(<HeroSection />));

  it("renders the page title heading", () => {
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /stock every shelf with confidence/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the supporting subtitle", () => {
    expect(
      screen.getByText(/premium liquor and compliant cannabis/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/mary jane collection/i)).toBeInTheDocument();
  });

  it("links to the catalog and distribution coverage", () => {
    expect(screen.getByRole("link", { name: /browse catalog/i })).toHaveAttribute(
      "href",
      "#catalog",
    );
    expect(
      screen.getByRole("link", { name: /view delivery coverage/i }),
    ).toHaveAttribute("href", "#distribution");
  });

  it("shows retailer safeguards and fulfillment highlights", () => {
    expect(
      screen.getByText(/business license verification required/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/3 regional hubs/i)).toBeInTheDocument();
    expect(screen.getByText(/99.2% fill rate/i)).toBeInTheDocument();
  });
});
