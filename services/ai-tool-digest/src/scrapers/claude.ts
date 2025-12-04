import { fetchFeed } from "./rss.js";
import type { ToolUpdate } from "../types.js";

const CLAUDE_FEED = "https://www.anthropic.com/news/rss.xml";

export async function fetchClaudeUpdates(limit = 5): Promise<ToolUpdate[]> {
  const items = await fetchFeed(CLAUDE_FEED);

  return items
    .filter((item) =>
      /claude|code|enterprise/i.test(`${item.title} ${item.content ?? ""}`)
    )
    .slice(0, limit)
    .map((item) => ({
      source: "claude",
      title: item.title,
      link: item.link,
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      summary: item.content ?? "",
      tags: ["Anthropic", "Claude", ...(item.categories ?? [])],
    }));
}
