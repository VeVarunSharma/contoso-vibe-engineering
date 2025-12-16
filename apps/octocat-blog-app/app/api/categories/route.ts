import { db } from "@/src/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allCategories = await db.query.categories.findMany();

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
