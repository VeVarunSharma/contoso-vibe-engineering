import { jest } from "@jest/globals";
import type { NormalisedFeedItem } from "../../types.js";

const fetchFeed =
  jest.fn<(url: string) => Promise<NormalisedFeedItem[]>>();

jest.unstable_mockModule("../rss.js", () => ({
  fetchFeed,
}));

const { fetchCursorUpdates } = await import("../cursor.js");

describe("fetchCursorUpdates", () => {
  beforeEach(() => {
    fetchFeed.mockReset();
  });

  it("maps items into ToolUpdates tagged with Cursor / Pair Programming", async () => {
    fetchFeed.mockResolvedValueOnce([
      {
        title: "Cursor 1.0",
        link: "https://cursor.com/a",
        content: "Notes",
        categories: ["release"],
        isoDate: "2025-04-01T00:00:00Z",
      },
    ]);

    const [first] = await fetchCursorUpdates();

    expect(first).toMatchObject({
      source: "cursor",
      title: "Cursor 1.0",
      link: "https://cursor.com/a",
      summary: "Notes",
      tags: ["Cursor", "Pair Programming", "release"],
    });
    expect(first?.publishedAt).toEqual(new Date("2025-04-01T00:00:00Z"));
  });

  it("falls back to the current date when isoDate is missing", async () => {
    const before = Date.now();
    fetchFeed.mockResolvedValueOnce([
      {
        title: "Cursor patch",
        link: "https://cursor.com/p",
        content: "",
      },
    ]);

    const [first] = await fetchCursorUpdates();
    const after = Date.now();

    expect(first?.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(first?.publishedAt.getTime()).toBeLessThanOrEqual(after);
  });

  it("respects the limit argument", async () => {
    fetchFeed.mockResolvedValueOnce(
      Array.from({ length: 7 }, (_, i) => ({
        title: `Cursor ${i}`,
        link: `https://cursor.com/${i}`,
        content: "",
      }))
    );

    const result = await fetchCursorUpdates(2);

    expect(result).toHaveLength(2);
  });
});
