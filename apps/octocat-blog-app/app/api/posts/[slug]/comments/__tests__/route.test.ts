/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { mockDb } from "@test-mocks/db";

jest.mock("@/src/db", () => {
  const { mockDb } = jest.requireActual("@test-mocks/db");
  return { db: mockDb };
});

import { GET, POST } from "@/app/api/posts/[slug]/comments/route";

const params = Promise.resolve({ slug: "test-post" });
const publishedPost = { id: 1, published: true };
const comment = {
  id: 10,
  displayName: "Reader",
  content: "Great post!",
  createdAt: new Date("2026-09-10T12:00:00Z"),
};

describe("/api/posts/[slug]/comments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns public comment fields", async () => {
    mockDb.query.posts.findFirst.mockResolvedValueOnce(publishedPost);
    mockDb.query.comments.findMany.mockResolvedValueOnce([comment]);

    const response = await GET(
      new NextRequest("http://localhost/api/posts/test-post/comments"),
      { params },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      comments: [
        {
          id: 10,
          displayName: "Reader",
          content: "Great post!",
          createdAt: "2026-09-10T12:00:00.000Z",
        },
      ],
    });
  });

  it("validates comment input", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/posts/test-post/comments", {
        method: "POST",
        body: JSON.stringify({ displayName: "", content: "" }),
      }),
      { params },
    );

    expect(response.status).toBe(400);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("creates a comment for a published post", async () => {
    mockDb.query.posts.findFirst.mockResolvedValueOnce(publishedPost);
    mockDb.returning.mockResolvedValueOnce([comment]);

    const response = await POST(
      new NextRequest("http://localhost/api/posts/test-post/comments", {
        method: "POST",
        body: JSON.stringify({
          displayName: " Reader ",
          content: " Great post! ",
        }),
      }),
      { params },
    );

    expect(response.status).toBe(201);
    expect(mockDb.values).toHaveBeenCalledWith({
      postId: 1,
      displayName: "Reader",
      content: "Great post!",
    });
    await expect(response.json()).resolves.toEqual({
      comment: {
        ...comment,
        createdAt: "2026-09-10T12:00:00.000Z",
      },
    });
  });

  it("does not create comments for unavailable posts", async () => {
    mockDb.query.posts.findFirst.mockResolvedValueOnce(null);

    const response = await POST(
      new NextRequest("http://localhost/api/posts/missing/comments", {
        method: "POST",
        body: JSON.stringify({ displayName: "Reader", content: "Hello" }),
      }),
      { params: Promise.resolve({ slug: "missing" }) },
    );

    expect(response.status).toBe(404);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
