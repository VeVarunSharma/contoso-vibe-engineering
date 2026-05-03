import * as React from "react";
import { render, screen } from "@testing-library/react";

import { SiteFooter } from "@/components/site-footer";

describe("<SiteFooter />", () => {
  it("renders the footer attribution text", () => {
    render(<SiteFooter />);
    expect(
      screen.getByText(/built by the fantastic four at microsoft/i),
    ).toBeInTheDocument();
  });

  it("uses a semantic <footer> element", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
