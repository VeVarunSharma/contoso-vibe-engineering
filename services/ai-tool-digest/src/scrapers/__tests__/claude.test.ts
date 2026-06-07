import { jest } from "@jest/globals";
import type { NormalisedFeedItem } from "../../types.js";

const fetchFeed =
  jest.fn<(url: string) => Promise<NormalisedFeedItem[]>>();

jest.unstable_mockModule("../rss.js", () => ({
  fetchFeed,
}));

const { fetchClaudeUpdates } = await import("../claude.js");

describe("fetchClaudeUpdates", () => {
  beforeEach(() => {
    fetchFeed.mockReset();
  });

  it("only includes items mentioning claude/code/enterprise", async () => {
    fetchFeed.mockResolvedValueOnce([
      {
        title: "Claude 3.5 released",
        link: "https://anthropic.com/a",
        content: "",
      },
      {
        title: "Random unrelated topic",
        link: "https://anthropic.com/b",
        content: "Talking about hardware",
      },
      {
        title: "New enterprise tier",
        link: "https://anthropic.com/c",
        content: "",
      },
      {
        title: "Generic post",
        link: "https://anthropic.com/d",
        content: "Mentions code samples in body",
      },
    ]);

    const result = await fetchClaudeUpdates();

    expect(result.map((r) => r.link)).toEqual([
      "https://anthropic.com/a",
      "https://anthropic.com/c",
      "https://anthropic.com/d",
    ]);
  });

  it("tags every result with Anthropic + Claude and any source categories", async () => {
    fetchFeed.mockResolvedValueOnce([
      {
        title: "Claude updates",
        link: "https://anthropic.com/a",
        content: "",
        categories: ["release"],
        isoDate: "2025-03-01T00:00:00Z",
      },
    ]);

    const [first] = await fetchClaudeUpdates();

    expect(first?.source).toBe("claude");
    expect(first?.tags).toEqual(["Anthropic", "Claude", "release"]);
    expect(first?.publishedAt).toEqual(new Date("2025-03-01T00:00:00Z"));
  });

  it("respects the limit argument after filtering", async () => {
    fetchFeed.mockResolvedValueOnce(
      Array.from({ length: 6 }, (_, i) => ({
        title: `Claude post ${i}`,
        link: `https://anthropic.com/${i}`,
        content: "",
      }))
    );

    const result = await fetchClaudeUpdates(2);

    expect(result).toHaveLength(2);
  });

  it("returns [] when nothing matches the keyword filter", async () => {
    fetchFeed.mockResolvedValueOnce([
      {
        title: "Hardware research",
        link: "https://anthropic.com/h",
        content: "Datacenter discussion",
      },
    ]);

    await expect(fetchClaudeUpdates()).resolves.toEqual([]);
  });
});
