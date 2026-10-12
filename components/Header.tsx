"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth-context";
import { useProfileModal } from "@/components/ProfileModalProvider";

export function Header() {
  const { user, profile, logout, configured } = useAuth();
  const { openProfile } = useProfileModal();

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-3 sm:px-4 py-3 sm:py-7">
      <Link href={user ? "/home" : "/"} className="flex items-center gap-2 shrink-0">
        <Image
          src="/quizster-logo.png"
          alt="Quizster"
          width={350}
          height={125}
          className="h-9 sm:h-16 md:h-20 lg:h-[7.25rem] w-auto -rotate-2 drop-shadow-sm transition hover:opacity-95"
          priority
        />
      </Link>
      <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
        {configured && user ? (
          <>
            <button
              type="button"
              onClick={() => openProfile(user.uid)}
              className="flex items-center gap-1.5 sm:gap-2.5 rounded-full bg-white/80 hover:bg-white px-2.5 py-1 sm:px-3.5 sm:py-1.5 shadow-card transition hover:-translate-y-0.5 active:translate-y-0 border border-midnight/5"
              title="View your profile"
            >
              <Avatar id={profile?.avatarId || "yellow"} size="sm" showRing />
              <span className="max-w-[70px] sm:max-w-none truncate text-xs sm:text-base font-extrabold text-midnight">
                {profile?.displayName || user.displayName || user.email?.split("@")[0]}
              </span>
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full bg-white px-3 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-base font-extrabold text-midnight shadow-card transition hover:-translate-y-0.5 active:translate-y-0"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-xs sm:text-base font-extrabold text-french">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-french px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-base font-extrabold text-white shadow-bubble"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
