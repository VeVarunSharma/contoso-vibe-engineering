/**
 * @jest-environment node
 */

import { mockCategories, createMockDb } from "@test-mocks/db";

// Create mock db instance
const mockDb = createMockDb();

// Mock the database module
jest.mock("@/src/db", () => ({
  db: mockDb,
}));

// Import after mocking
import { GET } from "@/app/api/categories/route";

describe("GET /api/categories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns all categories successfully", async () => {
    mockDb.query.categories.findMany.mockResolvedValueOnce(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockCategories);
    expect(data).toHaveLength(3);
  });

  it("returns categories with expected properties", async () => {
    mockDb.query.categories.findMany.mockResolvedValueOnce(mockCategories);

    const response = await GET();
    const data = await response.json();

    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("name");
    expect(data[0]).toHaveProperty("slug");
    expect(data[0]).toHaveProperty("description");
    expect(data[0]).toHaveProperty("color");
  });

  it("returns empty array when no categories exist", async () => {
    mockDb.query.categories.findMany.mockResolvedValueOnce([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns 500 when database query fails", async () => {
    mockDb.query.categories.findMany.mockRejectedValueOnce(
      new Error("Database error")
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch categories" });
  });
});
