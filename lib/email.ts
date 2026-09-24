import crypto from "crypto";
import nodemailer from "nodemailer";

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.GEMINI_API_KEY ||
    "quizster-verification-secret-key-39184"
  );
}

export function generate4DigitCode(): string {
  // Generates a random 4-digit code between 1000 and 9999
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function createVerificationToken(email: string, code: string, expiresInMinutes = 10): {
  token: string;
  expiresAt: number;
} {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const normalizedEmail = email.trim().toLowerCase();
  const hash = crypto
    .createHmac("sha256", getAuthSecret())
    .update(`${normalizedEmail}:${code}:${expiresAt}`)
    .digest("hex");

  return {
    token: `${expiresAt}:${hash}`,
    expiresAt,
  };
}

export function verifyCodeToken(
  email: string,
  code: string,
  token: string,
): { valid: boolean; error?: string } {
  if (!token || !token.includes(":")) {
    return { valid: false, error: "Invalid verification token. Please request a new code." };
  }

  const [expiresAtStr, hash] = token.split(":");
  const expiresAt = Number(expiresAtStr);

  if (!expiresAt || isNaN(expiresAt)) {
    return { valid: false, error: "Invalid verification token timestamp." };
  }

  if (Date.now() > expiresAt) {
    return { valid: false, error: "Verification code has expired. Please request a new one." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();
  const expectedHash = crypto
    .createHmac("sha256", getAuthSecret())
    .update(`${normalizedEmail}:${normalizedCode}:${expiresAtStr}`)
    .digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (hashBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(hashBuffer, expectedBuffer)) {
    return { valid: false, error: "Incorrect verification code. Please check your email." };
  }

  return { valid: true };
}

export async function sendVerificationEmail(
  email: string,
  code: string,
  displayName?: string,
): Promise<{ sent: boolean; devMode?: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const greetingName = displayName ? displayName.trim() : "there";

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || (host === "smtp.gmail.com" ? "465" : "587"));
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || `"Quizster" <${user || "no-reply@quizster.app"}>`;

  // Always log code to server console for developer convenience
  console.info("==================================================");
  console.info(`[Quizster Auth] 4-digit code for ${normalizedEmail}: ${code}`);
  console.info("==================================================");

  if (!user || !pass) {
    // SMTP credentials not configured yet in .env.local
    console.warn(
      `[Quizster Auth] SMTP_USER or SMTP_PASS is missing in .env.local. The verification code has been logged above for testing.`,
    );
    return { sent: true, devMode: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Quizster Verification Code</title>
        </head>
        <body style="margin: 0; padding: 24px; background-color: #FFF4EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #3D1534;">
          <div style="max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 28px; padding: 36px; box-shadow: 0 10px 30px rgba(61, 21, 52, 0.08); text-align: center;">
            <div style="font-size: 28px; font-weight: 900; color: #3E4B8E; margin-bottom: 8px;">
              Quizster 💡
            </div>
            <h1 style="font-size: 22px; font-weight: 800; color: #3D1534; margin: 0 0 12px;">
              Verify your email address
            </h1>
            <p style="font-size: 15px; color: #3D1534; opacity: 0.8; margin: 0 0 24px; line-height: 1.5;">
              Hi <strong>${greetingName}</strong>, enter this 4-digit code in the Quizster signup page to verify your account:
            </p>

            <div style="display: inline-block; background-color: #FFF4EB; border: 2px solid #3E4B8E; border-radius: 18px; padding: 16px 36px; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #3D1534; margin: 0 auto 24px;">
              ${code}
            </div>

            <p style="font-size: 13px; color: #3D1534; opacity: 0.6; margin: 0; line-height: 1.5;">
              This code will expire in <strong>10 minutes</strong>. If you didn't attempt to sign up for Quizster, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from,
      to: normalizedEmail,
      subject: `${code} is your Quizster verification code`,
      text: `Your Quizster verification code is: ${code}. It expires in 10 minutes.`,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error("[Quizster Auth] Failed to send verification email:", err);
    return {
      sent: false,
      error: err instanceof Error ? err.message : "Failed to deliver email. Please check SMTP settings.",
    };
  }
}
