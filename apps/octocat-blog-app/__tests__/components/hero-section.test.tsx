import React from "react";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/components/hero-section";

// Mock the @workspace/ui Button component
jest.mock("@workspace/ui/components/button", () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    [key: string]: unknown;
  }) => {
    if (asChild) {
      return <>{children}</>;
    }
    return <button {...props}>{children}</button>;
  },
}));

describe("HeroSection", () => {
  it("renders the main heading", () => {
    render(<HeroSection />);
    expect(screen.getByText("GitHub Updates,")).toBeInTheDocument();
    expect(screen.getByText("Straight from the Source")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<HeroSection />);
    expect(screen.getByText("The official Octocat Blog")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<HeroSection />);
    expect(
      screen.getByText(/Stay up to date with the latest releases/)
    ).toBeInTheDocument();
  });

  it("renders the Explore Posts button linking to latest posts", () => {
    render(<HeroSection />);
    const exploreLink = screen.getByRole("link", { name: /Explore Posts/i });
    expect(exploreLink).toHaveAttribute("href", "#latest-posts");
  });

  it("renders the Visit GitHub button linking to GitHub", () => {
    render(<HeroSection />);
    const githubLink = screen.getByRole("link", { name: /Visit GitHub/i });
    expect(githubLink).toHaveAttribute("href", "https://github.com");
    expect(githubLink).toHaveAttribute("target", "_blank");
  });

  describe("Stats section", () => {
    it("renders developer count", () => {
      render(<HeroSection />);
      expect(screen.getByText("100M+")).toBeInTheDocument();
      expect(screen.getByText("Developers")).toBeInTheDocument();
    });

    it("renders repository count", () => {
      render(<HeroSection />);
      expect(screen.getByText("330M+")).toBeInTheDocument();
      expect(screen.getByText("Repositories")).toBeInTheDocument();
    });

    it("renders organization count", () => {
      render(<HeroSection />);
      expect(screen.getByText("4M+")).toBeInTheDocument();
      expect(screen.getByText("Organizations")).toBeInTheDocument();
    });
  });
});
