import { NextResponse } from "next/server";
import { getContactSettings } from "@/lib/api-server/db";

export async function GET() {
  try {
    const settings = await getContactSettings();
    return NextResponse.json({
      available: Boolean(
        (settings.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim(),
      ),
    });
  } catch {
    return NextResponse.json({
      available: Boolean(
        (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim(),
      ),
    });
  }
}
