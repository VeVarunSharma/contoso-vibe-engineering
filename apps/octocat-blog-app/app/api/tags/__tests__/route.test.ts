/**
 * @jest-environment node
 */

import { mockTags, mockDb } from "@test-mocks/db";

// Mock the database module - uses the shared mockDb from @test-mocks/db
jest.mock("@/src/db", () => {
  const { mockDb } = jest.requireActual("@test-mocks/db");
  return { db: mockDb };
});

// Import after mocking
import { GET } from "@/app/api/tags/route";

describe("GET /api/tags", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns all tags successfully", async () => {
    mockDb.query.tags.findMany.mockResolvedValueOnce(mockTags);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // Compare against JSON-serialized mock to match Date serialization
    expect(data).toEqual(JSON.parse(JSON.stringify(mockTags)));
    expect(data).toHaveLength(3);
  });

  it("returns tags with expected properties", async () => {
    mockDb.query.tags.findMany.mockResolvedValueOnce(mockTags);

    const response = await GET();
    const data = await response.json();

    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("name");
    expect(data[0]).toHaveProperty("slug");
    expect(data[0]).toHaveProperty("createdAt");
  });

  it("returns empty array when no tags exist", async () => {
    mockDb.query.tags.findMany.mockResolvedValueOnce([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns 500 when database query fails", async () => {
    mockDb.query.tags.findMany.mockRejectedValueOnce(
      new Error("Database error")
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch tags" });
  });
});
