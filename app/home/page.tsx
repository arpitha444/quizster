"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { useProfileModal } from "@/components/ProfileModalProvider";
import { findRoomByCode, joinRoom, listMyQuizzes } from "@/lib/rooms";
import type { QuizDoc } from "@/lib/types";

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeInner />
    </AuthGuard>
  );
}

function HomeInner() {
  const { user, profile } = useAuth();
  const { openProfile } = useProfileModal();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [quizzes, setQuizzes] = useState<(QuizDoc & { id: string })[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  useEffect(() => {
    if (!user) return;
    listMyQuizzes(user.uid)
      .then(setQuizzes)
      .catch(() => setQuizzes([]))
      .finally(() => setLoadingQuizzes(false));
  }, [user]);

  async function onJoin(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setJoinError("");
    const room = await findRoomByCode(code.trim());
    if (!room) {
      setJoinError("No room with that code. Check with the host.");
      return;
    }
    if (room.status === "finished") {
      setJoinError("That race already ended.");
      return;
    }
    await joinRoom(
      room.id,
      user.uid,
      profile?.displayName || user.displayName || user.email?.split("@")[0] || "Player",
      room.hostId === user.uid,
      profile?.avatarId || "yellow",
    );
    router.push(`/room/${room.code}`);
  }

  const displayName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Player";

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Welcome Greeting & Streaks Bar */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between pt-1">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => user && openProfile(user.uid)}
            className="group relative shrink-0 cursor-pointer transition hover:scale-105 active:scale-95"
            title="Click to view and edit your profile"
          >
            <Avatar id={profile?.avatarId || "yellow"} size="lg" showRing />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-french text-[10px] font-black text-white shadow-sm">
              ✎
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-midnight truncate">
              Welcome back, <span className="text-french">{displayName}</span>
            </h1>
            <p className="text-xs sm:text-base font-semibold text-midnight/70 truncate">
              Ready to test your knowledge today?
            </p>
          </div>
        </div>

        {/* Streak Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => user && openProfile(user.uid)}
            className="flex items-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-3 py-1.5 sm:px-3.5 sm:py-2 transition hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0"
            title="View correct answer streak"
          >
            <span className="text-base sm:text-lg">🔥</span>
            <div className="text-left">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-800/70 leading-none">
                Streak
              </p>
              <p className="text-sm sm:text-base font-black text-amber-900 leading-tight">
                {profile?.correctStreak ?? 0}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => user && openProfile(user.uid)}
            className="flex items-center gap-2 rounded-2xl border-2 border-french/25 bg-french/5 px-3 py-1.5 sm:px-3.5 sm:py-2 transition hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0"
            title="View group quiz win streak"
          >
            <span className="text-base sm:text-lg">🏆</span>
            <div className="text-left">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-french/70 leading-none">
                Group Wins
              </p>
              <p className="text-sm sm:text-base font-black text-french leading-tight">
                {profile?.groupWinStreak ?? 0}
              </p>
            </div>
          </button>
        </div>
      </div>

      <section className="rounded-[2rem] bg-white p-5 sm:p-8 shadow-card">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-midnight">Ready to race?</h2>
            <p className="mt-1 text-xs sm:text-base font-semibold text-midnight/70">
              Upload notes to mint a quiz, or hop into a friend’s room.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-full bg-french px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-extrabold text-white shadow-bubble transition hover:-translate-y-0.5 active:translate-y-0 text-center"
          >
            Upload a PDF
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <form onSubmit={onJoin} className="rounded-[2rem] bg-white p-5 sm:p-6 shadow-card">
          <h2 className="text-lg sm:text-xl font-black text-midnight">Join with a code</h2>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ABC123"
            className="mt-4 w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-3 py-2.5 sm:px-4 sm:py-3 text-center text-xl sm:text-2xl font-black tracking-[0.2em] sm:tracking-[0.3em] outline-none focus:border-french"
          />
          {joinError ? <p className="mt-2 text-sm font-bold text-red-700">{joinError}</p> : null}
          <Button type="submit" className="mt-4 w-full" disabled={code.length < 6}>
            Join room
          </Button>
        </form>

        <div className="rounded-[2rem] bg-white p-5 sm:p-6 shadow-card">
          <h2 className="text-lg sm:text-xl font-black text-midnight">Your recent quizzes</h2>
          {loadingQuizzes ? <p className="mt-4 text-sm font-bold text-midnight/60">Loading…</p> : null}
          {!loadingQuizzes && quizzes.length === 0 ? (
            <p className="mt-4 text-sm font-bold text-midnight/60">Nothing here yet. Upload a PDF to generate your first quiz.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-seashell px-3.5 py-2.5 sm:px-4 sm:py-3 font-extrabold text-midnight hover:bg-wheat"
                  >
                    <span className="truncate text-sm sm:text-base">{quiz.title}</span>
                    <span className="shrink-0 text-xs sm:text-sm text-french">{quiz.questionCount} Qs</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
