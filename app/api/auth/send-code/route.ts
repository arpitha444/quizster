import { NextRequest, NextResponse } from "next/server";
import {
  createVerificationToken,
  generate4DigitCode,
  sendVerificationEmail,
} from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName } = body as { email?: string; displayName?: string };

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const code = generate4DigitCode();
    const { token, expiresAt } = createVerificationToken(normalizedEmail, code, 10);

    const emailResult = await sendVerificationEmail(normalizedEmail, code, displayName);

    if (!emailResult.sent && emailResult.error) {
      return NextResponse.json(
        { error: `Could not send verification email: ${emailResult.error}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      devMode: emailResult.devMode,
      message: `A 4-digit code was sent to ${normalizedEmail}.`,
    });
  } catch (error) {
    console.error("[send-code error]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process verification code." },
      { status: 500 },
    );
  }
}
