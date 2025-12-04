import { fetchFeed } from "./rss.js";
import type { ToolUpdate } from "../types.js";

const COPILOT_FEED = "https://github.blog/changelog/label/copilot/feed/";

export async function fetchCopilotUpdates(limit = 5): Promise<ToolUpdate[]> {
  const items = await fetchFeed(COPILOT_FEED);

  return items.slice(0, limit).map((item) => ({
    source: "copilot",
    title: item.title,
    link: item.link,
    publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
    summary: item.content ?? "",
    tags: ["GitHub", "Copilot", ...(item.categories ?? [])],
  }));
}
