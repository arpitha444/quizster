"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { formatAuthError, useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { signUp, signInGoogle, configured, user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [cooldown, setCooldown] = useState(0);
  const [infoMsg, setInfoMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  async function onSendCode(event: FormEvent) {
    event.preventDefault();
    if (!isPasswordValid) {
      setError("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }
    setBusy(true);
    setError("");
    setInfoMsg("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), displayName: displayName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }
      setVerificationToken(data.token);
      setStep("verify");
      setCooldown(60);
      setInfoMsg(
        data.devMode
          ? "Verification code generated! (Dev mode: check server console for code)"
          : `A 4-digit verification code was sent to ${email.trim().toLowerCase()}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyAndSignup(event: FormEvent) {
    event.preventDefault();
    if (code.trim().length !== 4) {
      setError("Please enter the 4-digit code sent to your email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const verifyRes = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          token: verificationToken,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Invalid verification code.");
      }

      await signUp(email.trim().toLowerCase(), password, displayName.trim());
      router.push("/home");
    } catch (err) {
      setError(formatAuthError(err, "Could not create account."));
    } finally {
      setBusy(false);
    }
  }

  async function onResendCode() {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), displayName: displayName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code.");
      }
      setVerificationToken(data.token);
      setCooldown(60);
      setInfoMsg(
        data.devMode
          ? "New code generated! (Dev mode: check server console for code)"
          : `New verification code sent to ${email.trim().toLowerCase()}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogleSignIn() {
    setBusy(true);
    setError("");
    try {
      await signInGoogle();
      router.push("/home");
    } catch (err) {
      const msg = formatAuthError(err, "Google sign-in failed.");
      if (msg) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-card">
      <h1 className="text-3xl font-black text-midnight">
        {step === "form" ? "Join Quizster" : "Verify Email"}
      </h1>
      <p className="mt-2 font-semibold text-midnight/70">
        {step === "form"
          ? "Make an account and start a quiz race."
          : `Enter the 4-digit code sent to ${email}.`}
      </p>

      {step === "form" ? (
        <>
          <form onSubmit={onSendCode} className="mt-6 space-y-4">
            <input
              required
              placeholder="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 font-bold outline-none focus:border-french"
            />
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 font-bold outline-none focus:border-french"
            />
            <div>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Password (8+ characters)"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 font-bold outline-none focus:border-french"
              />
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                <span
                  className={`rounded-full px-2.5 py-0.5 transition ${
                    hasMinLength ? "bg-emerald-100 text-emerald-800" : "bg-seashell text-midnight/50"
                  }`}
                >
                  {hasMinLength ? "✓" : "•"} 8+ chars
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 transition ${
                    hasLetter ? "bg-emerald-100 text-emerald-800" : "bg-seashell text-midnight/50"
                  }`}
                >
                  {hasLetter ? "✓" : "•"} Letters
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 transition ${
                    hasNumber ? "bg-emerald-100 text-emerald-800" : "bg-seashell text-midnight/50"
                  }`}
                >
                  {hasNumber ? "✓" : "•"} Numbers
                </span>
              </div>
            </div>

            {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

            <Button
              type="submit"
              className="w-full"
              disabled={busy || !configured || !displayName || !email || !isPasswordValid}
            >
              {busy ? "Sending code…" : "Continue with Email"}
            </Button>
          </form>

          <Button
            type="button"
            variant="wheat"
            className="mt-3 w-full"
            disabled={!configured || busy}
            onClick={onGoogleSignIn}
          >
            Continue with Google
          </Button>
        </>
      ) : (
        /* Step 2: 4-Digit Code Verification */
        <form onSubmit={onVerifyAndSignup} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wide text-midnight/70">
              4-Digit Code
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]{4}"
              placeholder="••••"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              className="mt-1.5 w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 text-center text-3xl font-black tracking-[0.5em] text-midnight outline-none focus:border-french"
            />
          </div>

          {infoMsg ? (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
              {infoMsg}
            </div>
          ) : null}

          {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={busy || code.length !== 4}>
            {busy ? "Verifying…" : "Verify & Create Account"}
          </Button>

          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <button
              type="button"
              onClick={onResendCode}
              disabled={cooldown > 0 || busy}
              className={`hover:underline ${cooldown > 0 ? "text-midnight/40" : "text-french"}`}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setCode("");
                setError("");
                setInfoMsg("");
              }}
              className="text-midnight/60 hover:text-midnight underline"
            >
              Change email
            </button>
          </div>
        </form>
      )}

      <p className="mt-4 text-center font-semibold text-midnight/70">
        Already racing?{" "}
        <Link href="/login" className="font-extrabold text-french">
          Log in
        </Link>
      </p>
    </div>
  );
}
