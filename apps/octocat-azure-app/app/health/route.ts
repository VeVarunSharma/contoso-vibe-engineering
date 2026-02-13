import { NextResponse } from "next/server";

export async function GET() {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION ?? "0.0.1",
    environment: process.env.ENVIRONMENT ?? "unknown",
    checks: {
      app: "ok",
      uptime: `${process.uptime().toFixed(0)}s`,
    },
  };

  return NextResponse.json(healthCheck, { status: 200 });
}
