/**
 * @jest-environment node
 */
import { triageAndCreateIssue } from "@/lib/copilot-triage";
import { SAMPLE_TICKET } from "@/lib/sample-ticket";

interface IssueArguments {
  title: string;
  body: string;
  labels: string[];
}

interface MockTool {
  handler: (args: IssueArguments) => Promise<{ resultType: string }>;
}

const mockStart = jest.fn<Promise<void>, []>();
const mockStop = jest.fn<Promise<void>, []>();
const mockDestroy = jest.fn<Promise<void>, []>();
const mockSend = jest.fn<Promise<null>, [{ prompt: string }, number]>();
const mockSession = { sendAndWait: mockSend, destroy: mockDestroy };
const mockCreateSession = jest.fn<
  Promise<typeof mockSession>,
  [{ tools: MockTool[]; availableTools: string[] }]
>();

// The SDK exports ESM; keep this Jest boundary test entirely credential-free.
jest.mock(
  "@github/copilot-sdk",
  () => ({
    CopilotClient: class {
      start = mockStart;
      stop = mockStop;
      createSession = mockCreateSession;
    },
    defineTool: (_name: string, tool: MockTool) => tool,
  }),
  { virtual: true },
);

const config = { token: "test-only", owner: "example", repo: "support" };
const args: IssueArguments = {
  title: "[Bug] Order search",
  body: "Synthetic report only.",
  labels: ["bug", "priority:high"],
};

describe("live AI issue creation boundary", () => {
  beforeEach(() => {
    mockStart.mockResolvedValue(undefined);
    mockStop.mockResolvedValue(undefined);
    mockDestroy.mockResolvedValue(undefined);
    mockCreateSession.mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("permits only the issue tool and attempts creation at most once per session", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          html_url: "https://github.com/example/support/issues/42",
          number: 42,
          title: args.title,
          labels: [{ name: "bug" }, { name: "priority:high" }],
        }),
        { status: 201 },
      ),
    );
    mockSend.mockImplementation(async () => {
      const tool = mockCreateSession.mock.calls[0]?.[0].tools[0];
      if (!tool) throw new Error("Expected the issue tool");
      expect((await tool.handler(args)).resultType).toBe("success");
      expect((await tool.handler(args)).resultType).toBe("failure");
      return null;
    });
    expect(await triageAndCreateIssue(SAMPLE_TICKET, config)).toMatchObject({
      success: true,
      issueNumber: 42,
    });
    expect(mockCreateSession.mock.calls[0]?.[0].availableTools).toEqual([
      "create_github_issue",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("does not retry a failed creation inside the model session", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("connection lost"));
    mockSend.mockImplementation(async () => {
      const tool = mockCreateSession.mock.calls[0]?.[0].tools[0];
      if (!tool) throw new Error("Expected the issue tool");
      await tool.handler(args);
      await tool.handler(args);
      return null;
    });
    expect(await triageAndCreateIssue(SAMPLE_TICKET, config)).toMatchObject({
      success: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("cleans up the SDK session and client when the model request fails", async () => {
    mockSend.mockRejectedValue(new Error("model unavailable"));
    await expect(triageAndCreateIssue(SAMPLE_TICKET, config)).rejects.toThrow(
      "model unavailable",
    );
    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(mockStop).toHaveBeenCalledTimes(1);
  });
});
