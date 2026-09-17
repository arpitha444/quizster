"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { signUp, signInGoogle, configured } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signUp(email, password, displayName);
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-card">
      <h1 className="text-3xl font-black text-midnight">Join Quizster</h1>
      <p className="mt-2 font-semibold text-midnight/70">Make an account and start a quiz race.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 font-bold outline-none focus:border-french"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 font-bold outline-none focus:border-french"
        />
        {error ? <p className="text-sm font-bold text-red-700">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy || !configured}>
          {busy ? "Creating…" : "Sign up"}
        </Button>
      </form>
      <Button
        type="button"
        variant="wheat"
        className="mt-3 w-full"
        disabled={!configured || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await signInGoogle();
            router.push("/home");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Continue with Google
      </Button>
      <p className="mt-4 text-center font-semibold text-midnight/70">
        Already racing?{" "}
        <Link href="/login" className="font-extrabold text-french">
          Log in
        </Link>
      </p>
    </div>
  );
}
