import * as React from "react";
import { render, screen } from "@testing-library/react";

import { SiteFooter } from "@/components/site-footer";

describe("<SiteFooter />", () => {
  it("renders the footer attribution text", () => {
    render(<SiteFooter />);
    expect(
      screen.getByText(/for licensed retailers and authorized buyers only/i),
    ).toBeInTheDocument();
  });

  it("uses a semantic <footer> element", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
