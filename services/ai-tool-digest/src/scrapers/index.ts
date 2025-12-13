import { fetchClaudeUpdates } from "./claude.js";
import { fetchCopilotUpdates } from "./copilot.js";
import { fetchCursorUpdates } from "./cursor.js";
import type { ToolUpdate } from "../types.js";

export interface ScrapeOptions {
  limitPerSource?: number;
}

export async function collectUpdates({
  limitPerSource = 5,
}: ScrapeOptions = {}): Promise<ToolUpdate[]> {
  const [copilot, claude, cursor] = await Promise.all([
    fetchCopilotUpdates(limitPerSource),
    fetchClaudeUpdates(limitPerSource),
    fetchCursorUpdates(limitPerSource),
  ]);

  return [...copilot, ...claude, ...cursor].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}
