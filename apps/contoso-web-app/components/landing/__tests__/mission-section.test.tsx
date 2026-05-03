import * as React from "react";
import { render, screen } from "@testing-library/react";

import { MissionSection } from "@/components/landing/mission-section";

describe("<MissionSection />", () => {
  beforeEach(() => render(<MissionSection />));

  it("renders the section heading", () => {
    expect(
      screen.getByRole("heading", { level: 2, name: /shipping safely at velocity/i }),
    ).toBeInTheDocument();
  });

  it("renders the three pillars (Velocity, Safety, Agentic Upgrades)", () => {
    expect(
      screen.getByRole("heading", { level: 3, name: /velocity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /safety/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /agentic upgrades/i }),
    ).toBeInTheDocument();
  });

  it("uses 'mission' as the section anchor id", () => {
    const heading = screen.getByRole("heading", { level: 2 });
    const section = heading.closest("section");
    expect(section).toHaveAttribute("id", "mission");
  });
});
