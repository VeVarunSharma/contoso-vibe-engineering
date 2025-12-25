import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthorCard } from "@/components/author-card";
import type { Author } from "@/src/db/schema";

const mockAuthor: Author = {
  id: 1,
  name: "Octocat",
  username: "octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  bio: "The official GitHub mascot sharing the latest updates from GitHub.",
  githubUrl: "https://github.com/octocat",
  createdAt: new Date("2025-01-01"),
};

describe("AuthorCard", () => {
  it("renders the author name", () => {
    render(<AuthorCard author={mockAuthor} />);
    expect(screen.getByText("Octocat")).toBeInTheDocument();
  });

  it("renders the author username with @ prefix", () => {
    render(<AuthorCard author={mockAuthor} />);
    expect(screen.getByText("@octocat")).toBeInTheDocument();
  });

  it("renders the author bio", () => {
    render(<AuthorCard author={mockAuthor} />);
    expect(
      screen.getByText(
        "The official GitHub mascot sharing the latest updates from GitHub."
      )
    ).toBeInTheDocument();
  });

  it("renders the author avatar with correct alt text", () => {
    render(<AuthorCard author={mockAuthor} />);
    const avatar = screen.getByAltText("Octocat");
    expect(avatar).toBeInTheDocument();
  });

  it("links to the author page", () => {
    render(<AuthorCard author={mockAuthor} />);
    const link = screen.getByRole("link", { name: "Octocat" });
    expect(link).toHaveAttribute("href", "/author/octocat");
  });

  it("renders GitHub profile link", () => {
    render(<AuthorCard author={mockAuthor} />);
    const githubLink = screen.getByLabelText("View GitHub profile");
    expect(githubLink).toHaveAttribute("href", "https://github.com/octocat");
    expect(githubLink).toHaveAttribute("target", "_blank");
  });

  describe("Author without optional fields", () => {
    it("renders without avatar when avatarUrl is null", () => {
      const authorWithoutAvatar: Author = {
        ...mockAuthor,
        avatarUrl: null,
      };
      render(<AuthorCard author={authorWithoutAvatar} />);
      expect(screen.queryByAltText("Octocat")).not.toBeInTheDocument();
    });

    it("renders without bio when bio is null", () => {
      const authorWithoutBio: Author = {
        ...mockAuthor,
        bio: null,
      };
      render(<AuthorCard author={authorWithoutBio} />);
      expect(
        screen.queryByText(
          "The official GitHub mascot sharing the latest updates from GitHub."
        )
      ).not.toBeInTheDocument();
    });

    it("renders without GitHub link when githubUrl is null", () => {
      const authorWithoutGithub: Author = {
        ...mockAuthor,
        githubUrl: null,
      };
      render(<AuthorCard author={authorWithoutGithub} />);
      expect(
        screen.queryByLabelText("View GitHub profile")
      ).not.toBeInTheDocument();
    });
  });
});
