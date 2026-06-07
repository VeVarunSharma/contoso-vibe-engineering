import * as React from "react";
import { render, screen } from "@testing-library/react";

import { TeamSection } from "@/components/landing/team-section";

describe("<TeamSection />", () => {
  beforeEach(() => render(<TeamSection />));

  it("renders the section heading", () => {
    expect(
      screen.getByRole("heading", { level: 2, name: /the fantastic four/i }),
    ).toBeInTheDocument();
  });

  it("renders all four team member names", () => {
    ["Chris", "Ricardo", "Mehdi", "Ve"].forEach((name) => {
      expect(
        screen.getByRole("heading", { level: 3, name }),
      ).toBeInTheDocument();
    });
  });

  it("renders a role label for each member", () => {
    expect(screen.getAllByText(/^solution engineer$/i).length).toBe(4);
  });

  it("uses 'team' as the section anchor id", () => {
    const heading = screen.getByRole("heading", { level: 2 });
    const section = heading.closest("section");
    expect(section).toHaveAttribute("id", "team");
  });
});
