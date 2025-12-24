import React from "react";
import { render, screen } from "@testing-library/react";
import { PostCard } from "@/components/post-card";
import type { Post, Author, Category } from "@/src/db/schema";

// Mock data
const mockAuthor: Author = {
  id: 1,
  name: "Octocat",
  username: "octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  bio: "The official GitHub mascot",
  githubUrl: "https://github.com/octocat",
  createdAt: new Date("2025-01-01"),
};

const mockCategory: Category = {
  id: 1,
  name: "Releases",
  slug: "releases",
  description: "New GitHub releases",
  color: "#238636",
  createdAt: new Date("2025-01-01"),
};

const mockPost: Post & { author: Author; category: Category } = {
  id: 1,
  title: "Test Blog Post Title",
  slug: "test-blog-post",
  excerpt: "This is a test excerpt for the blog post.",
  content: "Full content of the blog post.",
  coverImage: "https://example.com/cover.jpg",
  authorId: 1,
  categoryId: 1,
  published: true,
  featured: false,
  publishedAt: new Date("2025-12-20"),
  createdAt: new Date("2025-12-20"),
  updatedAt: new Date("2025-12-20"),
  author: mockAuthor,
  category: mockCategory,
};

describe("PostCard", () => {
  describe("Regular variant", () => {
    it("renders the post title", () => {
      render(<PostCard post={mockPost} />);
      expect(screen.getByText("Test Blog Post Title")).toBeInTheDocument();
    });

    it("renders the post excerpt", () => {
      render(<PostCard post={mockPost} />);
      expect(
        screen.getByText("This is a test excerpt for the blog post.")
      ).toBeInTheDocument();
    });

    it("renders the category name", () => {
      render(<PostCard post={mockPost} />);
      expect(screen.getByText("Releases")).toBeInTheDocument();
    });

    it("renders the author name", () => {
      render(<PostCard post={mockPost} />);
      expect(screen.getByText("Octocat")).toBeInTheDocument();
    });

    it("links to the correct post page", () => {
      render(<PostCard post={mockPost} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/post/test-blog-post");
    });

    it("renders the cover image with correct alt text", () => {
      render(<PostCard post={mockPost} />);
      const image = screen.getByAltText("Test Blog Post Title");
      expect(image).toBeInTheDocument();
    });

    it('shows "Draft" when post is not published', () => {
      const draftPost = {
        ...mockPost,
        publishedAt: null,
      };
      render(<PostCard post={draftPost} />);
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });
  });

  describe("Featured variant", () => {
    it("renders featured post with larger layout", () => {
      render(<PostCard post={mockPost} featured={true} />);
      const article = screen.getByRole("article");
      expect(article).toHaveClass("group", "relative");
    });

    it("renders the author avatar in featured variant", () => {
      render(<PostCard post={mockPost} featured={true} />);
      const avatar = screen.getByAltText("Octocat");
      expect(avatar).toBeInTheDocument();
    });

    it("renders category badge with custom color", () => {
      render(<PostCard post={mockPost} featured={true} />);
      const categoryBadge = screen.getByText("Releases");
      expect(categoryBadge).toHaveStyle({ backgroundColor: "#238636" });
    });
  });

  describe("Post without cover image", () => {
    it("renders without cover image section", () => {
      const postWithoutImage = {
        ...mockPost,
        coverImage: null,
      };
      render(<PostCard post={postWithoutImage} />);
      expect(
        screen.queryByAltText("Test Blog Post Title")
      ).not.toBeInTheDocument();
    });
  });

  describe("Author without avatar", () => {
    it("renders without author avatar", () => {
      const authorWithoutAvatar = {
        ...mockAuthor,
        avatarUrl: null,
      };
      const postWithoutAuthorAvatar = {
        ...mockPost,
        author: authorWithoutAvatar,
      };
      render(<PostCard post={postWithoutAuthorAvatar} />);
      expect(screen.queryByAltText("Octocat")).not.toBeInTheDocument();
    });
  });
});
