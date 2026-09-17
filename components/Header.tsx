"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const { user, logout, configured } = useAuth();

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
      <Link href={user ? "/home" : "/"} className="flex items-center gap-3">
        <Image
          src="/quizster-logo.png"
          alt="Quizster"
          width={270}
          height={96}
          className="-rotate-2 drop-shadow-sm"
          priority
        />
      </Link>
      <nav className="flex items-center gap-3">
        {configured && user ? (
          <>
            <span className="hidden text-sm font-bold text-midnight/70 sm:inline">
              {user.displayName || user.email}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-midnight shadow-card transition hover:-translate-y-0.5"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="font-extrabold text-french">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-french px-4 py-2 text-sm font-extrabold text-white shadow-bubble"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
