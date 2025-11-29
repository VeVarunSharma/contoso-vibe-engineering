import { NextResponse } from "next/server";
import { db } from "../../../lib/db.js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const users = await db.query(`SELECT * FROM users WHERE id = ${id}`);

  return NextResponse.json(users[0]);
}
