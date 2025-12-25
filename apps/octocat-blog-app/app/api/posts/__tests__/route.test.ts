/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { mockPosts, mockDb, mockUnpublishedPost } from "@test-mocks/db";

// Mock the database module - uses the shared mockDb from @test-mocks/db
jest.mock("@/src/db", () => {
  const { mockDb } = jest.requireActual("@test-mocks/db");
  return { db: mockDb };
});

// Import after mocking
import { GET } from "@/app/api/posts/route";

describe("GET /api/posts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns published posts successfully", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // Compare against JSON-serialized mock to match Date serialization
    expect(data).toEqual(JSON.parse(JSON.stringify(mockPosts)));
  });

  it("returns posts with author and category relations", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data[0]).toHaveProperty("author");
    expect(data[0]).toHaveProperty("category");
    expect(data[0].author.name).toBe("Octocat");
    expect(data[0].category.name).toBe("Releases");
  });

  it("returns posts with tags", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data[0]).toHaveProperty("postTags");
    expect(data[0].postTags[0].tag.name).toBe("GitHub Actions");
  });

  it("returns 500 when database query fails", async () => {
    // Create a new mock that throws an error
    const { db } = require("@/src/db");
    db.query.posts.findMany.mockRejectedValueOnce(new Error("Database error"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch posts" });
  });
});
