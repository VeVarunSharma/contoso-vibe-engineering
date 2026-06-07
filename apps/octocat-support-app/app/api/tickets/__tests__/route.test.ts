/**
 * @jest-environment node
 */
import { POST } from "@/app/api/tickets/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/direct-triage", () => ({
  triageAndCreateIssueDirect: jest.fn(),
}));
jest.mock("@/lib/copilot-triage", () => ({
  triageAndCreateIssue: jest.fn(),
}));

import { triageAndCreateIssueDirect } from "@/lib/direct-triage";
import { triageAndCreateIssue } from "@/lib/copilot-triage";

const directMock = triageAndCreateIssueDirect as jest.MockedFunction<
  typeof triageAndCreateIssueDirect
>;
const sdkMock = triageAndCreateIssue as jest.MockedFunction<
  typeof triageAndCreateIssue
>;

const validTicket = {
  name: "Alice",
  email: "alice@example.com",
  category: "bug",
  priority: "medium",
  subject: "A reasonable subject line",
  description:
    "A description that is at least twenty characters in length so it parses.",
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/tickets", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      GITHUB_TOKEN: "tok",
      GITHUB_OWNER: "octo",
      GITHUB_REPO: "blog",
      USE_COPILOT_SDK: "false",
    };
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 400 when the request body fails Zod validation", async () => {
    const res = await POST(makeRequest({ name: "x" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Validation error/);
    expect(directMock).not.toHaveBeenCalled();
  });

  it("returns 500 when required env vars are missing", async () => {
    delete process.env.GITHUB_TOKEN;
    const res = await POST(makeRequest(validTicket));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/configuration error/i);
    expect(directMock).not.toHaveBeenCalled();
  });

  it("returns 201 when direct triage succeeds (default mode)", async () => {
    directMock.mockResolvedValueOnce({
      success: true,
      issueNumber: 7,
      issueUrl: "https://github.com/octo/blog/issues/7",
      title: "[Bug] x",
      labels: ["bug", "priority:medium"],
    });
    const res = await POST(makeRequest(validTicket));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.issueNumber).toBe(7);
    expect(directMock).toHaveBeenCalledTimes(1);
    expect(sdkMock).not.toHaveBeenCalled();
  });

  it("returns 500 when triage reports failure", async () => {
    directMock.mockResolvedValueOnce({
      success: false,
      error: "boom",
    });
    const res = await POST(makeRequest(validTicket));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe("boom");
  });

  it("falls back to direct triage when the Copilot SDK throws", async () => {
    process.env.USE_COPILOT_SDK = "true";
    sdkMock.mockRejectedValueOnce(new Error("sdk down"));
    directMock.mockResolvedValueOnce({
      success: true,
      issueNumber: 8,
      issueUrl: "u",
      title: "t",
      labels: [],
    });
    const res = await POST(makeRequest(validTicket));
    expect(res.status).toBe(201);
    expect(sdkMock).toHaveBeenCalledTimes(1);
    expect(directMock).toHaveBeenCalledTimes(1);
  });

  it("uses the Copilot SDK path when USE_COPILOT_SDK=true and it succeeds", async () => {
    process.env.USE_COPILOT_SDK = "true";
    sdkMock.mockResolvedValueOnce({
      success: true,
      issueNumber: 9,
      issueUrl: "u",
      title: "t",
      labels: [],
    });
    const res = await POST(makeRequest(validTicket));
    expect(res.status).toBe(201);
    expect(sdkMock).toHaveBeenCalledTimes(1);
    expect(directMock).not.toHaveBeenCalled();
  });
});
