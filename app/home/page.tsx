"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
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
  const { user } = useAuth();
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
    await joinRoom(room.id, user.uid, user.displayName || user.email?.split("@")[0] || "Player", room.hostId === user.uid);
    router.push(`/room/${room.code}`);
  }

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Player";

  return (
    <div className="space-y-7">
      {/* Welcome Greeting */}
      <div className="space-y-1.5 pt-1">
        <h1 className="text-3xl font-black tracking-tight text-midnight sm:text-4xl">
          Welcome back, <span className="text-french">{displayName}</span>
        </h1>
        <p className="text-base font-normal text-midnight/70 sm:text-lg">
          What would you like to be quizzed on today?
        </p>
      </div>

      <section className="rounded-[2rem] bg-white p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-midnight">Ready to race?</h2>
            <p className="mt-1 font-semibold text-midnight/70">
              Upload notes to mint a quiz, or hop into a friend’s room.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-full bg-french px-6 py-3 font-extrabold text-white shadow-bubble transition hover:-translate-y-0.5 active:translate-y-0"
          >
            Upload a PDF
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={onJoin} className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-midnight">Join with a code</h2>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            maxLength={6}
            placeholder="ABC123"
            className="mt-4 w-full rounded-2xl border-2 border-midnight/10 bg-seashell px-4 py-3 text-center text-2xl font-black tracking-[0.3em] outline-none focus:border-french"
          />
          {joinError ? <p className="mt-2 text-sm font-bold text-red-700">{joinError}</p> : null}
          <Button type="submit" className="mt-4 w-full" disabled={code.length < 6}>
            Join room
          </Button>
        </form>

        <div className="rounded-[2rem] bg-white p-6 shadow-card">
          <h2 className="text-xl font-black text-midnight">Your recent quizzes</h2>
          {loadingQuizzes ? <p className="mt-4 font-bold text-midnight/60">Loading…</p> : null}
          {!loadingQuizzes && quizzes.length === 0 ? (
            <p className="mt-4 font-bold text-midnight/60">Nothing here yet. Upload a PDF to generate your first quiz.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="flex items-center justify-between rounded-2xl bg-seashell px-4 py-3 font-extrabold text-midnight hover:bg-wheat"
                  >
                    <span className="truncate">{quiz.title}</span>
                    <span className="text-sm text-french">{quiz.questionCount} Qs</span>
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
