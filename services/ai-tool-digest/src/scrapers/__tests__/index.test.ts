import { jest } from "@jest/globals";
import type { ToolUpdate } from "../../types.js";

const fetchCopilotUpdates =
  jest.fn<(limit?: number) => Promise<ToolUpdate[]>>();
const fetchClaudeUpdates =
  jest.fn<(limit?: number) => Promise<ToolUpdate[]>>();
const fetchCursorUpdates =
  jest.fn<(limit?: number) => Promise<ToolUpdate[]>>();

jest.unstable_mockModule("../copilot.js", () => ({
  fetchCopilotUpdates,
}));
jest.unstable_mockModule("../claude.js", () => ({
  fetchClaudeUpdates,
}));
jest.unstable_mockModule("../cursor.js", () => ({
  fetchCursorUpdates,
}));

const { collectUpdates } = await import("../index.js");

const update = (
  source: ToolUpdate["source"],
  isoDate: string,
  title = `${source} ${isoDate}`
): ToolUpdate => ({
  source,
  title,
  link: `https://example.com/${source}/${isoDate}`,
  publishedAt: new Date(isoDate),
  summary: "",
  tags: [],
});

describe("collectUpdates", () => {
  beforeEach(() => {
    fetchCopilotUpdates.mockReset();
    fetchClaudeUpdates.mockReset();
    fetchCursorUpdates.mockReset();
  });

  it("merges all sources sorted newest-first", async () => {
    fetchCopilotUpdates.mockResolvedValueOnce([
      update("copilot", "2025-05-10T00:00:00Z"),
    ]);
    fetchClaudeUpdates.mockResolvedValueOnce([
      update("claude", "2025-05-15T00:00:00Z"),
    ]);
    fetchCursorUpdates.mockResolvedValueOnce([
      update("cursor", "2025-05-12T00:00:00Z"),
    ]);

    const result = await collectUpdates();

    expect(result.map((r) => r.source)).toEqual([
      "claude",
      "cursor",
      "copilot",
    ]);
  });

  it("forwards the limitPerSource option to each scraper", async () => {
    fetchCopilotUpdates.mockResolvedValueOnce([]);
    fetchClaudeUpdates.mockResolvedValueOnce([]);
    fetchCursorUpdates.mockResolvedValueOnce([]);

    await collectUpdates({ limitPerSource: 3 });

    expect(fetchCopilotUpdates).toHaveBeenCalledWith(3);
    expect(fetchClaudeUpdates).toHaveBeenCalledWith(3);
    expect(fetchCursorUpdates).toHaveBeenCalledWith(3);
  });

  it("returns an empty array when every source is empty", async () => {
    fetchCopilotUpdates.mockResolvedValueOnce([]);
    fetchClaudeUpdates.mockResolvedValueOnce([]);
    fetchCursorUpdates.mockResolvedValueOnce([]);

    await expect(collectUpdates()).resolves.toEqual([]);
  });
});
