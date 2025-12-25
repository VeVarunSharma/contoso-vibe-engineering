import { db } from "@/src/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allTags = await db.query.tags.findMany();

    return NextResponse.json(allTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
