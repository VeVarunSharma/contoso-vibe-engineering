import { buildIssueDraft } from "@/lib/ticket-draft";
import { ticketFormSchema, type PreviewResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<PreviewResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Send a valid JSON report and try again." },
      { status: 400 },
    );
  }

  const parsed = ticketFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: `Validation error: ${parsed.error.issues[0]?.message ?? "Invalid input"}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      mode: "template-preview",
      draft: buildIssueDraft(parsed.data),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
