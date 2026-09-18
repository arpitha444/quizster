"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { formatAuthError, useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { signIn, signInGoogle, configured, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/home");
    }
  }, [user, loading, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signIn(email, password);
      router.push("/home");
    } catch (err) {
      setError(formatAuthError(err, "Could not log in."));
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
      <h1 className="text-3xl font-black text-midnight">Welcome back</h1>
      <p className="mt-2 font-semibold text-midnight/70">Log in to host or join a race.</p>
      {!configured ? (
        <p className="mt-4 rounded-2xl bg-wheat p-3 text-sm font-bold">Add Firebase keys in .env.local first.</p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 font-bold outline-none focus:border-french"
        />
        <div>
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 font-bold outline-none focus:border-french"
          />
          <div className="mt-1.5 flex justify-end">
            <Link
              href={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
              className="text-xs font-bold text-french hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
        {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy || !configured}>
          {busy ? "Logging in…" : "Log in"}
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
      <p className="mt-4 text-center font-semibold text-midnight/70">
        New here?{" "}
        <Link href="/signup" className="font-extrabold text-french">
          Sign up
        </Link>
      </p>
    </div>
  );
}
