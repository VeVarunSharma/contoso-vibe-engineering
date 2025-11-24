import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";

// SECURITY SUCCESS 1: Zod Schema for validation
const QuerySchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // SECURITY SUCCESS 2: Validate input
  const result = QuerySchema.safeParse({ id: searchParams.get("id") });

  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // SECURITY SUCCESS 3: Use ORM method
  const user = await db.user.findUnique({
    where: { id: result.data.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // SECURITY SUCCESS 4: Return only safe fields (DTO)
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    // password_hash and salt are EXCLUDED
  });
}
