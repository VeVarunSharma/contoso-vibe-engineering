import { triageAndCreateIssue } from "@/lib/copilot-triage";
import { triageAndCreateIssueDirect } from "@/lib/direct-triage";
import { ticketFormSchema, type TicketResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<TicketResponse>> {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const parsed = ticketFormSchema.safeParse(body);
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

    // Check for required environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;

    if (!githubToken || !githubOwner || !githubRepo) {
      console.error(
        "Missing required environment variables: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO",
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Server configuration error. Please contact the administrator.",
        },
        { status: 500 },
      );
    }

    const config = {
      token: githubToken,
      owner: githubOwner,
      repo: githubRepo,
    };

    // Try Copilot SDK triage first, fall back to direct triage
    let result: TicketResponse;
    const useCopilotSdk = process.env.USE_COPILOT_SDK === "true";

    if (useCopilotSdk) {
      try {
        result = await triageAndCreateIssue(ticket, config);
      } catch (sdkError) {
        console.warn(
          "Copilot SDK triage failed, falling back to direct triage:",
          sdkError,
        );
        result = await triageAndCreateIssueDirect(ticket, config);
      }
    } else {
      // Direct triage mode (default) — no Copilot CLI dependency
      result = await triageAndCreateIssueDirect(ticket, config);
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
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
