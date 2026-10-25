/**
 * @jest-environment node
 */
import { POST } from "@/app/api/tickets/preview/route";
import { SAMPLE_TICKET } from "@/lib/sample-ticket";
import { buildIssueDraft } from "@/lib/ticket-draft";
import { NextRequest } from "next/server";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/tickets/preview", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/tickets/preview", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns a deterministic real draft with no integration calls or fabricated issue identity", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Network must not be used"));
    const first = await POST(request(SAMPLE_TICKET));
    const second = await POST(request(SAMPLE_TICKET));
    const body: unknown = await first.json();
    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      success: true,
      mode: "template-preview",
      draft: buildIssueDraft(SAMPLE_TICKET),
    });
    expect(await second.json()).toEqual(body);
    expect(body).not.toHaveProperty("issueUrl");
    expect(body).not.toHaveProperty("issueNumber");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid report", async () => {
    const result = await POST(
      request({ ...SAMPLE_TICKET, description: "short" }),
    );
    expect(result.status).toBe(400);
    expect(await result.json()).toMatchObject({
      success: false,
      error: expect.stringContaining("Description"),
    });
  });

  it("rejects malformed JSON", async () => {
    const result = await POST(
      new NextRequest("http://localhost/api/tickets/preview", {
        method: "POST",
        body: "{",
      }),
    );
    expect(result.status).toBe(400);
    expect(await result.json()).toMatchObject({ success: false });
  });
});
