import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SiteHeader } from "@/components/site-header";
import { axe } from "jest-axe";

// Mock the @workspace/ui Button component
jest.mock("@workspace/ui/components/button", () => ({
  Button: ({
    children,
    asChild,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    onClick?: () => void;
    [key: string]: unknown;
  }) => {
    if (asChild) {
      return <>{children}</>;
    }
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
}));

describe("SiteHeader", () => {
  it("renders the site logo/title", () => {
    render(<SiteHeader />);
    expect(screen.getByText("Octocat Blog")).toBeInTheDocument();
  });

  it("renders the home link pointing to root", () => {
    render(<SiteHeader />);
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  describe("Desktop navigation", () => {
    it("renders navigation links", () => {
      render(<SiteHeader />);
      expect(screen.getByRole("link", { name: /releases/i })).toHaveAttribute(
        "href",
        "/category/releases",
      );
      expect(screen.getByRole("link", { name: /features/i })).toHaveAttribute(
        "href",
        "/category/features",
      );
      expect(screen.getByRole("link", { name: /changelog/i })).toHaveAttribute(
        "href",
        "/category/changelog",
      );
      expect(
        screen.getByRole("link", { name: /engineering/i }),
      ).toHaveAttribute("href", "/category/engineering");
    });
  });

  describe("Theme toggle", () => {
    it("renders theme toggle button", () => {
      render(<SiteHeader />);
      const themeButton = screen.getByLabelText("Toggle theme");
      expect(themeButton).toBeInTheDocument();
    });
  });

  describe("GitHub link", () => {
    it("renders GitHub link with correct attributes", () => {
      render(<SiteHeader />);
      const githubLink = screen.getByLabelText("GitHub");
      expect(githubLink).toHaveAttribute("href", "https://github.com");
      expect(githubLink).toHaveAttribute("target", "_blank");
    });
  });

  describe("Mobile menu", () => {
    it("renders mobile menu toggle button", () => {
      render(<SiteHeader />);
      const menuButton = screen.getByLabelText("Toggle menu");
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
      expect(menuButton).toHaveAttribute("aria-controls", "mobile-navigation");
    });

    it("toggles mobile menu when button is clicked", () => {
      render(<SiteHeader />);
      const menuButton = screen.getByLabelText("Toggle menu");

      // Menu should not be visible initially
      // (Desktop nav is always visible, but mobile nav should not be)
      const mobileNav = screen.queryByRole("navigation", {
        hidden: true,
      });

      // Click to open mobile menu
      fireEvent.click(menuButton);
      expect(menuButton).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("navigation", { name: "Mobile navigation" }),
      ).toBeInTheDocument();

      // After clicking, mobile navigation links should be visible
      // We check for multiple Home links - one in desktop, one in mobile
      const homeLinks = screen.getAllByText("Home");
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("provides a skip link and passes the axe audit", async () => {
    const { container } = render(<SiteHeader />);
    expect(
      screen.getByRole("link", { name: /skip to main content/i }),
    ).toHaveAttribute("href", "#main-content");
    expect(await axe(container)).toHaveNoViolations();
  });
});
