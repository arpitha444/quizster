"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && configured && !user) {
      router.replace("/login");
    }
  }, [configured, loading, router, user]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg rounded-[2rem] bg-white p-8 shadow-card">
        <h1 className="text-2xl font-extrabold text-midnight">Almost ready</h1>
        <p className="mt-3 text-midnight/80">
          Copy <code className="rounded bg-wheat px-1">.env.example</code> to{" "}
          <code className="rounded bg-wheat px-1">.env.local</code>, add your Firebase and Gemini keys,
          then restart the dev server.
        </p>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="flex justify-center py-20">
        <div className="rounded-full bg-white px-6 py-3 font-bold text-french shadow-card">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
