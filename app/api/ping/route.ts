import { NextResponse } from "next/server";

/** Health check, and a straight answer on whether the Gemini key is wired up. */
export function GET() {
  return NextResponse.json({
    ok: true,
    app: "砺知",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
}
