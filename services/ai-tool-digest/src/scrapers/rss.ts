import Parser from "rss-parser";
import type { NormalisedFeedItem } from "../types.js";

const parser = new Parser();

export async function fetchFeed(url: string): Promise<NormalisedFeedItem[]> {
  const feed = await parser.parseURL(url);
  return (feed.items ?? []).map((item) => ({
    title: item.title ?? "Untitled",
    link: item.link ?? url,
    isoDate: item.isoDate,
    content: item.contentSnippet ?? item.content ?? "",
    categories: item.categories ?? [],
  }));
}
