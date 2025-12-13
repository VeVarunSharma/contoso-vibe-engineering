import { fetchFeed } from "./rss.js";
import type { ToolUpdate } from "../types.js";

const CURSOR_FEED = "https://cursor.com/blog/rss.xml";

export async function fetchCursorUpdates(limit = 5): Promise<ToolUpdate[]> {
  const items = await fetchFeed(CURSOR_FEED);

  return items.slice(0, limit).map((item) => ({
    source: "cursor",
    title: item.title,
    link: item.link,
    publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
    summary: item.content ?? "",
    tags: ["Cursor", "Pair Programming", ...(item.categories ?? [])],
  }));
}
