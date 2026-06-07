import * as React from "react";
import { render, screen } from "@testing-library/react";

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
    expect(screen.getByText(/contoso vibe/i)).toBeInTheDocument();
  });

  it("renders Mission, Team, and Muppets nav items", () => {
    expect(screen.getByRole("link", { name: /mission/i })).toHaveAttribute(
      "href",
      "#mission",
    );
    expect(screen.getByRole("link", { name: /team/i })).toHaveAttribute(
      "href",
      "#team",
    );
    expect(screen.getByRole("link", { name: /muppets/i })).toHaveAttribute(
      "href",
      "/muppets",
    );
  });

  it("renders the GitHub link with target=_blank and rel=noreferrer", () => {
    const github = screen.getByRole("link", { name: /github/i });
    expect(github).toHaveAttribute("href", "https://github.com/contoso-vibe");
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noreferrer");
  });

  it("uses a semantic <header> element", () => {
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});
