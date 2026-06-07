import { jest } from "@jest/globals";

const parseURL = jest.fn();

jest.unstable_mockModule("rss-parser", () => ({
  default: jest.fn().mockImplementation(() => ({
    parseURL,
  })),
}));

const { fetchFeed } = await import("../rss.js");

describe("fetchFeed", () => {
  beforeEach(() => {
    parseURL.mockReset();
  });

  it("normalises a valid feed into NormalisedFeedItem[]", async () => {
    parseURL.mockResolvedValueOnce({
      items: [
        {
          title: "First post",
          link: "https://example.com/first",
          isoDate: "2025-01-15T10:00:00Z",
          contentSnippet: "Summary of first post",
          categories: ["news", "ai"],
        },
        {
          title: "Second post",
          link: "https://example.com/second",
          isoDate: "2025-01-16T10:00:00Z",
          content: "Body of second post",
        },
      ],
    });

    const result = await fetchFeed("https://example.com/feed.xml");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      title: "First post",
      link: "https://example.com/first",
      isoDate: "2025-01-15T10:00:00Z",
      content: "Summary of first post",
      categories: ["news", "ai"],
    });
    expect(result[1]?.content).toBe("Body of second post");
    expect(result[1]?.categories).toEqual([]);
  });

  it("falls back when items omit title/link", async () => {
    parseURL.mockResolvedValueOnce({
      items: [
        {
          isoDate: "2025-01-15T10:00:00Z",
        },
      ],
    });

    const result = await fetchFeed("https://example.com/feed.xml");

    expect(result[0]).toEqual({
      title: "Untitled",
      link: "https://example.com/feed.xml",
      isoDate: "2025-01-15T10:00:00Z",
      content: "",
      categories: [],
    });
  });

  it("returns an empty array when the feed has no items", async () => {
    parseURL.mockResolvedValueOnce({});

    await expect(fetchFeed("https://example.com/feed.xml")).resolves.toEqual(
      []
    );
  });

  it("propagates parser errors so callers can decide how to handle them", async () => {
    parseURL.mockRejectedValueOnce(new Error("network failure"));

    await expect(fetchFeed("https://example.com/feed.xml")).rejects.toThrow(
      "network failure"
    );
  });
});
