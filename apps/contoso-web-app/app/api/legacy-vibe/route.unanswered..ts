import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db.js";

const QuerySchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const result = QuerySchema.safeParse({ id: searchParams.get("id") });

  if (!result.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: result.data.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}
