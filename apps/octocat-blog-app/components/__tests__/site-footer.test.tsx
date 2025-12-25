import React from "react";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@/components/site-footer";

describe("SiteFooter", () => {
  it("renders the footer element", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });

  describe("Product section", () => {
    it("renders Product heading", () => {
      render(<SiteFooter />);
      expect(screen.getByText("Product")).toBeInTheDocument();
    });

    it("renders Features link", () => {
      render(<SiteFooter />);
      const featuresLinks = screen.getAllByRole("link", { name: /features/i });
      const productFeaturesLink = featuresLinks.find(
        (link) => link.getAttribute("href") === "/category/features"
      );
      expect(productFeaturesLink).toBeInTheDocument();
    });

    it("renders Releases link", () => {
      render(<SiteFooter />);
      const releasesLinks = screen.getAllByRole("link", { name: /releases/i });
      const productReleasesLink = releasesLinks.find(
        (link) => link.getAttribute("href") === "/category/releases"
      );
      expect(productReleasesLink).toBeInTheDocument();
    });

    it("renders Security link", () => {
      render(<SiteFooter />);
      const securityLinks = screen.getAllByRole("link", { name: /security/i });
      const productSecurityLink = securityLinks.find(
        (link) => link.getAttribute("href") === "/category/security"
      );
      expect(productSecurityLink).toBeInTheDocument();
    });

    it("renders Changelog link", () => {
      render(<SiteFooter />);
      const changelogLinks = screen.getAllByRole("link", {
        name: /changelog/i,
      });
      const productChangelogLink = changelogLinks.find(
        (link) => link.getAttribute("href") === "/category/changelog"
      );
      expect(productChangelogLink).toBeInTheDocument();
    });
  });

  describe("Platform section", () => {
    it("renders Platform heading", () => {
      render(<SiteFooter />);
      expect(screen.getByText("Platform")).toBeInTheDocument();
    });

    it("renders GitHub Actions external link", () => {
      render(<SiteFooter />);
      const actionsLink = screen.getByRole("link", { name: "GitHub Actions" });
      expect(actionsLink).toHaveAttribute(
        "href",
        "https://github.com/features/actions"
      );
    });

    it("renders GitHub Copilot external link", () => {
      render(<SiteFooter />);
      const copilotLink = screen.getByRole("link", { name: "GitHub Copilot" });
      expect(copilotLink).toHaveAttribute(
        "href",
        "https://github.com/features/copilot"
      );
    });
  });

  describe("Support section", () => {
    it("renders Support heading", () => {
      render(<SiteFooter />);
      expect(screen.getByText("Support")).toBeInTheDocument();
    });
  });
});
