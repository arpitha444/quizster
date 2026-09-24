import { NextRequest, NextResponse } from "next/server";
import { verifyCodeToken } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, token } = body as { email?: string; code?: string; token?: string };

    if (!email || !code || !token) {
      return NextResponse.json(
        { error: "Email, 4-digit code, and verification token are required." },
        { status: 400 },
      );
    }

    const trimmedCode = code.trim();
    if (!/^\d{4}$/.test(trimmedCode)) {
      return NextResponse.json(
        { error: "Please enter a valid 4-digit numeric code." },
        { status: 400 },
      );
    }

    const result = verifyCodeToken(email, trimmedCode, token);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid or expired verification code." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[verify-code error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify code." },
      { status: 500 },
    );
  }
}
