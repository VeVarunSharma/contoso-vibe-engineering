import { triageAndCreateIssueDirect } from "@/lib/direct-triage";
import type { TicketFormData } from "@/lib/types";

const baseTicket: TicketFormData = {
  name: "Alice",
  email: "alice@example.com",
  category: "bug",
  priority: "medium",
  subject: "Search returns no results",
  description: "When I search for anything in the catalog the results are empty.",
};

const config = { token: "secret-token", owner: "octo", repo: "blog" };

describe("triageAndCreateIssueDirect", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    delete (globalThis as unknown as { fetch?: typeof fetch }).fetch;
    jest.restoreAllMocks();
  });

  function mockOk(payload: Record<string, unknown>) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => payload,
    } as unknown as Response);
  }

  function mockFail(status: number, body: string) {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status,
      text: async () => body,
      json: async () => ({}),
    } as unknown as Response);
  }

  it("creates a bug-prefixed issue with the right labels", async () => {
    mockOk({
      html_url: "https://github.com/octo/blog/issues/42",
      number: 42,
      title: "[Bug] Search returns no results",
      labels: [{ name: "bug" }, { name: "priority:medium" }],
    });

    const result = await triageAndCreateIssueDirect(baseTicket, config);

    expect(result.success).toBe(true);
    expect(result.issueNumber).toBe(42);
    expect(result.issueUrl).toBe("https://github.com/octo/blog/issues/42");
    expect(result.title).toContain("[Bug]");
    expect(result.labels).toEqual(
      expect.arrayContaining(["bug", "priority:medium"]),
    );

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.github.com/repos/octo/blog/issues");
    expect((init as RequestInit).method).toBe("POST");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.title).toMatch(/^\[Bug\] /);
    expect(body.labels).toEqual(["bug", "priority:medium"]);
    expect(body.body).toContain("## Description");
    expect(body.body).toContain("Alice");
    expect(body.body).toContain("alice@example.com");
  });

  it("uses the [Feature] prefix for feature tickets", async () => {
    mockOk({ html_url: "u", number: 1, title: "[Feature] x", labels: [] });
    await triageAndCreateIssueDirect(
      { ...baseTicket, category: "feature" },
      config,
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(body.title.startsWith("[Feature]")).toBe(true);
    expect(body.labels).toContain("enhancement");
    expect(body.body).toContain("## Summary");
    expect(body.body).toContain("Acceptance Criteria");
  });

  it("uses the [Security] prefix and a security label", async () => {
    mockOk({ html_url: "u", number: 1, title: "x", labels: [] });
    await triageAndCreateIssueDirect(
      { ...baseTicket, category: "security", priority: "critical" },
      config,
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(body.title.startsWith("[Security]")).toBe(true);
    expect(body.labels).toContain("security");
    expect(body.labels).toContain("priority:critical");
    expect(body.body).toContain("Severity Assessment");
  });

  it("falls back to the generic body for question/docs categories", async () => {
    mockOk({ html_url: "u", number: 1, title: "x", labels: [] });
    await triageAndCreateIssueDirect(
      { ...baseTicket, category: "question" },
      config,
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(body.body).toContain("## Summary");
    expect(body.body).toContain("Expected Outcome");
  });

  it("truncates titles longer than 72 characters", async () => {
    mockOk({ html_url: "u", number: 1, title: "x", labels: [] });
    const longSubject = "a".repeat(120);
    await triageAndCreateIssueDirect(
      { ...baseTicket, subject: longSubject },
      config,
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0]![1] as RequestInit).body as string,
    );
    expect(body.title.length).toBeLessThanOrEqual(72);
  });

  it("returns a failure response when GitHub returns non-2xx", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockFail(401, '{"message":"Bad credentials"}');
    const result = await triageAndCreateIssueDirect(baseTicket, config);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/HTTP 401/);
  });

  it("returns a failure response when the fetch throws", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const result = await triageAndCreateIssueDirect(baseTicket, config);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/network down/);
  });
});
