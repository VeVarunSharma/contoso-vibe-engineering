/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { mockPosts, createMockDb, mockUnpublishedPost } from "@test-mocks/db";

// Create mock db instance
const mockDb = createMockDb();

// Mock the database module
jest.mock("@/src/db", () => ({
  db: mockDb,
}));

// Import after mocking
import { GET } from "@/app/api/posts/[slug]/route";

describe("GET /api/posts/[slug]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a post by slug successfully", async () => {
    mockDb.query.posts.findFirst.mockResolvedValueOnce(mockPosts[0]);

    const request = new NextRequest(
      "http://localhost:3000/api/posts/test-post-1"
    );
    const params = Promise.resolve({ slug: "test-post-1" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Test Post 1");
    expect(data.slug).toBe("test-post-1");
  });

  it("returns 404 when post is not found", async () => {
    mockDb.query.posts.findFirst.mockResolvedValueOnce(null);

    const request = new NextRequest(
      "http://localhost:3000/api/posts/non-existent"
    );
    const params = Promise.resolve({ slug: "non-existent" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Post not found" });
  });

  it("returns 404 when post is not published", async () => {
    mockDb.query.posts.findFirst.mockResolvedValueOnce(mockUnpublishedPost);

    const request = new NextRequest(
      "http://localhost:3000/api/posts/unpublished-post"
    );
    const params = Promise.resolve({ slug: "unpublished-post" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Post not published" });
  });

  it("returns post with all relations", async () => {
    mockDb.query.posts.findFirst.mockResolvedValueOnce(mockPosts[0]);

    const request = new NextRequest(
      "http://localhost:3000/api/posts/test-post-1"
    );
    const params = Promise.resolve({ slug: "test-post-1" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(data).toHaveProperty("author");
    expect(data).toHaveProperty("category");
    expect(data).toHaveProperty("postTags");
  });

  it("returns 500 when database query fails", async () => {
    mockDb.query.posts.findFirst.mockRejectedValueOnce(
      new Error("Database error")
    );

    const request = new NextRequest(
      "http://localhost:3000/api/posts/test-post-1"
    );
    const params = Promise.resolve({ slug: "test-post-1" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch post" });
  });
});
