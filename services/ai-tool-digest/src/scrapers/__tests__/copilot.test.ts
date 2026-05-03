import { jest } from "@jest/globals";
import type { NormalisedFeedItem } from "../../types.js";

const fetchFeed =
  jest.fn<(url: string) => Promise<NormalisedFeedItem[]>>();

jest.unstable_mockModule("../rss.js", () => ({
  fetchFeed,
}));

const { fetchCopilotUpdates } = await import("../copilot.js");

describe("fetchCopilotUpdates", () => {
  beforeEach(() => {
    fetchFeed.mockReset();
  });

  it("maps every item to a ToolUpdate tagged with GitHub/Copilot", async () => {
    fetchFeed.mockResolvedValueOnce([
      {
        title: "Item A",
        link: "https://github.blog/a",
        isoDate: "2025-02-01T00:00:00Z",
        content: "Summary A",
        categories: ["changelog"],
      },
      {
        title: "Item B",
        link: "https://github.blog/b",
        content: "Summary B",
      },
    ]);

    const result = await fetchCopilotUpdates();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      source: "copilot",
      title: "Item A",
      link: "https://github.blog/a",
      summary: "Summary A",
      tags: ["GitHub", "Copilot", "changelog"],
    });
    expect(result[0]?.publishedAt).toEqual(new Date("2025-02-01T00:00:00Z"));
    expect(result[1]?.tags).toEqual(["GitHub", "Copilot"]);
    expect(result[1]?.publishedAt).toBeInstanceOf(Date);
  });

  it("respects the limit argument", async () => {
    fetchFeed.mockResolvedValueOnce(
      Array.from({ length: 8 }, (_, i) => ({
        title: `Item ${i}`,
        link: `https://github.blog/${i}`,
        content: "",
      }))
    );

    const result = await fetchCopilotUpdates(3);

    expect(result).toHaveLength(3);
  });

  it("uses the default limit of 5 when none is provided", async () => {
    fetchFeed.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, i) => ({
        title: `Item ${i}`,
        link: `https://github.blog/${i}`,
        content: "",
      }))
    );

    const result = await fetchCopilotUpdates();

    expect(result).toHaveLength(5);
  });

  it("propagates fetchFeed errors", async () => {
    fetchFeed.mockRejectedValueOnce(new Error("rss down"));

    await expect(fetchCopilotUpdates()).rejects.toThrow("rss down");
  });
});
