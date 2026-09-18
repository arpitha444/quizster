"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { formatAuthError, useAuth } from "@/lib/auth-context";

function ForgotPasswordForm() {
  const { resetPassword, configured } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (cooldown > 0) return;

    setStatus("loading");
    setMessage("");

    const targetEmail = email.trim().toLowerCase();
    try {
      await resetPassword(targetEmail);
      setStatus("success");
      setMessage(
        `If an account exists for "${targetEmail}", a password reset link has been sent! Please check your inbox and spam folder.`
      );
      setCooldown(60);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(formatAuthError(err, "Failed to send reset email. Please try again."));
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-card">
      <h1 className="text-3xl font-black text-midnight">Reset password</h1>
      <p className="mt-2 font-semibold text-midnight/70">
        Enter your email and we&apos;ll send you a link to update your password.
      </p>

      {!configured ? (
        <p className="mt-4 rounded-2xl bg-wheat p-3 text-sm font-bold">Add Firebase keys in .env.local first.</p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          placeholder="Your registered email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 font-bold outline-none focus:border-french"
        />

        {status === "success" ? (
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            {message}
          </div>
        ) : null}

        {status === "error" ? (
          <p className="text-sm font-bold text-red-700">{message}</p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={status === "loading" || cooldown > 0 || !configured || !email}
        >
          {status === "loading"
            ? "Sending link…"
            : cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Send reset link"}
        </Button>
      </form>

      <p className="mt-4 text-center font-semibold text-midnight/70">
        Remembered your password?{" "}
        <Link href="/login" className="font-extrabold text-french">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-card text-center font-bold text-midnight/60">
          Loading…
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
