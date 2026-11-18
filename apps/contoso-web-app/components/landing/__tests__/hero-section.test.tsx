import * as React from "react";
import { render, screen } from "@testing-library/react";

import { HeroSection } from "@/components/landing/hero-section";

describe("<HeroSection />", () => {
  beforeEach(() => render(<HeroSection />));

  it("renders the page title heading", () => {
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /contoso vibe engineering/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the supporting subtitle", () => {
    expect(
      screen.getByText(/agentic upgrades for the modern enterprise/i),
    ).toBeInTheDocument();
  });

  it("renders Get Started and Learn More as actionable links", () => {
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "#mission",
    );
    expect(screen.getByRole("link", { name: /learn more/i })).toHaveAttribute(
      "href",
      "#team",
    );
  });
});
