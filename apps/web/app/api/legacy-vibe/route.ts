import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // SECURITY FLAW 1: SQL Injection vulnerability via template literal
  // SECURITY FLAW 2: No input validation
  const users = await db.query(`SELECT * FROM users WHERE id = ${id}`);

  // SECURITY FLAW 3: Returning full object including password_hash and salt
  return NextResponse.json(users[0]);
}
