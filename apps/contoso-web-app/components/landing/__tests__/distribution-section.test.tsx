import * as React from "react";
import { render, screen } from "@testing-library/react";

import { DistributionSection } from "@/components/landing/distribution-section";

describe("<DistributionSection />", () => {
  beforeEach(() => render(<DistributionSection />));

  it("renders the distribution services", () => {
    expect(
      screen.getByRole("heading", { name: /scheduled delivery/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /shelf-ready receiving/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /compliance records/i }),
    ).toBeInTheDocument();
  });

  it("states the retailer licensing requirement", () => {
    expect(
      screen.getByText(/only to verified, licensed businesses/i),
    ).toBeInTheDocument();
  });

  it("uses the distribution section anchor", () => {
    const heading = screen.getByRole("heading", {
      level: 2,
      name: /from warehouse to shelf/i,
    });

    expect(heading.closest("section")).toHaveAttribute("id", "distribution");
  });
});
