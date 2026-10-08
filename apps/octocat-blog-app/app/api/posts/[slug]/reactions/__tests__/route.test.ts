/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { mockDb } from "@test-mocks/db";

jest.mock("@/src/db", () => {
  const { mockDb } = jest.requireActual("@test-mocks/db");
  return { db: mockDb };
});

import { GET, POST } from "@/app/api/posts/[slug]/reactions/route";

const params = Promise.resolve({ slug: "test-post" });
const publishedPost = { id: 1, published: true };

describe("/api/posts/[slug]/reactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns counts for every supported reaction", async () => {
    mockDb.query.posts.findFirst.mockResolvedValueOnce(publishedPost);
    mockDb.groupBy.mockResolvedValueOnce([
      { type: "like", count: 2 },
      { type: "celebrate", count: 1 },
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/posts/test-post/reactions"),
      { params },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reactions: { like: 2, love: 0, celebrate: 1 },
    });
  });

  it("rejects unsupported reactions", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/posts/test-post/reactions", {
        method: "POST",
        body: JSON.stringify({ type: "angry" }),
      }),
      { params },
    );

    expect(response.status).toBe(400);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("creates a supported reaction", async () => {
    mockDb.query.posts.findFirst.mockResolvedValueOnce(publishedPost);
    mockDb.returning.mockResolvedValueOnce([{ type: "love" }]);

    const response = await POST(
      new NextRequest("http://localhost/api/posts/test-post/reactions", {
        method: "POST",
        body: JSON.stringify({ type: "love" }),
      }),
      { params },
    );

    expect(response.status).toBe(201);
    expect(mockDb.values).toHaveBeenCalledWith({ postId: 1, type: "love" });
    await expect(response.json()).resolves.toEqual({
      reaction: { type: "love" },
    });
  });
});
