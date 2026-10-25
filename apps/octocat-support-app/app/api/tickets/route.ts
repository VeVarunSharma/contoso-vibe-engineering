import { triageAndCreateIssue } from "@/lib/copilot-triage";
import { triageAndCreateIssueDirect } from "@/lib/direct-triage";
import { getPublishingAvailability } from "@/lib/support-config";
import { createTicketSchema, type TicketResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<TicketResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Send a valid JSON report and try again." },
      { status: 400 },
    );
  }

  try {
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${firstError?.message ?? "Invalid input"}`,
        },
        { status: 400 },
      );
    }

    const ticket = parsed.data;
    const publishing = getPublishingAvailability();
    if (publishing.mode === "preview" || publishing.mode === "unavailable") {
      return NextResponse.json(
        {
          success: false,
          error:
            publishing.mode === "preview"
              ? "GitHub publishing is disabled in preview mode. Download the local Markdown handoff instead."
              : publishing.reason,
        },
        { status: publishing.mode === "preview" ? 403 : 503 },
      );
    }

    if (ticket.category === "security") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Use an approved private security channel for this report. This portal does not publish security concerns to GitHub issues.",
        },
        { status: 403 },
      );
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;
    if (!githubToken || !githubOwner || !githubRepo) {
      throw new Error("GitHub configuration changed during the request");
    }

    const config = {
      token: githubToken,
      owner: githubOwner,
      repo: githubRepo,
    };

    let result: TicketResponse;

    if (publishing.mode === "copilot") {
      try {
        result = await triageAndCreateIssue(ticket, config);
      } catch (sdkError) {
        console.error("Copilot SDK triage failed:", sdkError);
        return NextResponse.json(
          {
            success: false,
            error:
              "AI triage could not confirm creation. No template fallback was used. Check the repository before retrying; you can still download the local draft.",
          },
          { status: 502 },
        );
      }
    } else {
      result = await triageAndCreateIssueDirect(ticket, config);
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Ticket creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 },
    );
  }
}
