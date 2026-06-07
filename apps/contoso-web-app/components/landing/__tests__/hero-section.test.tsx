import * as React from "react";
import { render, screen } from "@testing-library/react";

import { HeroSection } from "@/components/landing/hero-section";

describe("<HeroSection />", () => {
  beforeEach(() => render(<HeroSection />));

  it("renders the page title heading", () => {
    expect(
      screen.getByRole("heading", { level: 1, name: /contoso vibe engineering/i }),
    ).toBeInTheDocument();
  });

  it("renders the supporting subtitle", () => {
    expect(
      screen.getByText(/agentic upgrades for the modern enterprise/i),
    ).toBeInTheDocument();
  });

  it("renders Get Started and Learn More CTAs", () => {
    expect(
      screen.getByRole("button", { name: /get started/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /learn more/i }),
    ).toBeInTheDocument();
  });
});
