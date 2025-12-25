/**
 * @jest-environment node
 */

// Test that schema exports are correctly typed
import {
  authors,
  categories,
  tags,
  posts,
  postTags,
  authorsRelations,
  categoriesRelations,
  tagsRelations,
  postsRelations,
  postTagsRelations,
} from "@/src/db/schema";

import type {
  Author,
  NewAuthor,
  Category,
  NewCategory,
  Tag,
  NewTag,
  Post,
  NewPost,
} from "@/src/db/schema";

describe("Database Schema", () => {
  describe("Authors table", () => {
    it("exports authors table", () => {
      expect(authors).toBeDefined();
    });

    it("has required columns", () => {
      expect(authors.id).toBeDefined();
      expect(authors.name).toBeDefined();
      expect(authors.username).toBeDefined();
      expect(authors.avatarUrl).toBeDefined();
      expect(authors.bio).toBeDefined();
      expect(authors.githubUrl).toBeDefined();
      expect(authors.createdAt).toBeDefined();
    });

    it("exports authorsRelations", () => {
      expect(authorsRelations).toBeDefined();
    });
  });

  describe("Categories table", () => {
    it("exports categories table", () => {
      expect(categories).toBeDefined();
    });

    it("has required columns", () => {
      expect(categories.id).toBeDefined();
      expect(categories.name).toBeDefined();
      expect(categories.slug).toBeDefined();
      expect(categories.description).toBeDefined();
      expect(categories.color).toBeDefined();
      expect(categories.createdAt).toBeDefined();
    });

    it("exports categoriesRelations", () => {
      expect(categoriesRelations).toBeDefined();
    });
  });

  describe("Tags table", () => {
    it("exports tags table", () => {
      expect(tags).toBeDefined();
    });

    it("has required columns", () => {
      expect(tags.id).toBeDefined();
      expect(tags.name).toBeDefined();
      expect(tags.slug).toBeDefined();
      expect(tags.createdAt).toBeDefined();
    });

    it("exports tagsRelations", () => {
      expect(tagsRelations).toBeDefined();
    });
  });

  describe("Posts table", () => {
    it("exports posts table", () => {
      expect(posts).toBeDefined();
    });

    it("has required columns", () => {
      expect(posts.id).toBeDefined();
      expect(posts.title).toBeDefined();
      expect(posts.slug).toBeDefined();
      expect(posts.excerpt).toBeDefined();
      expect(posts.content).toBeDefined();
      expect(posts.coverImage).toBeDefined();
      expect(posts.authorId).toBeDefined();
      expect(posts.categoryId).toBeDefined();
      expect(posts.published).toBeDefined();
      expect(posts.featured).toBeDefined();
      expect(posts.publishedAt).toBeDefined();
      expect(posts.createdAt).toBeDefined();
      expect(posts.updatedAt).toBeDefined();
    });

    it("exports postsRelations", () => {
      expect(postsRelations).toBeDefined();
    });
  });

  describe("PostTags junction table", () => {
    it("exports postTags table", () => {
      expect(postTags).toBeDefined();
    });

    it("has required columns", () => {
      expect(postTags.postId).toBeDefined();
      expect(postTags.tagId).toBeDefined();
    });

    it("exports postTagsRelations", () => {
      expect(postTagsRelations).toBeDefined();
    });
  });

  describe("Type exports", () => {
    it("Author type can be used", () => {
      const author: Author = {
        id: 1,
        name: "Test Author",
        username: "testauthor",
        avatarUrl: null,
        bio: null,
        githubUrl: null,
        createdAt: new Date(),
      };
      expect(author.name).toBe("Test Author");
    });

    it("NewAuthor type can be used for inserts", () => {
      const newAuthor: NewAuthor = {
        name: "New Author",
        username: "newauthor",
      };
      expect(newAuthor.name).toBe("New Author");
    });

    it("Category type can be used", () => {
      const category: Category = {
        id: 1,
        name: "Test Category",
        slug: "test-category",
        description: null,
        color: "#000000",
        createdAt: new Date(),
      };
      expect(category.slug).toBe("test-category");
    });

    it("Tag type can be used", () => {
      const tag: Tag = {
        id: 1,
        name: "Test Tag",
        slug: "test-tag",
        createdAt: new Date(),
      };
      expect(tag.slug).toBe("test-tag");
    });

    it("Post type can be used", () => {
      const post: Post = {
        id: 1,
        title: "Test Post",
        slug: "test-post",
        excerpt: "Test excerpt",
        content: "Test content",
        coverImage: null,
        authorId: 1,
        categoryId: 1,
        published: false,
        featured: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(post.title).toBe("Test Post");
    });
  });
});
