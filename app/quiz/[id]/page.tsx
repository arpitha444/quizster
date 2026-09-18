"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { createRoom, getQuiz, joinRoom } from "@/lib/rooms";
import type { QuizDoc } from "@/lib/types";

export default function QuizPage() {
  return (
    <AuthGuard>
      <QuizInner />
    </AuthGuard>
  );
}

function QuizInner() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<(QuizDoc & { id: string }) | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getQuiz(params.id).then((result) => {
      if (!result) setError("Quiz not found.");
      else setQuiz(result);
    });
  }, [params.id]);

  async function hostOrSolo(solo: boolean) {
    if (!user || !quiz) return;
    setBusy(true);
    setError("");
    try {
      const room = await createRoom({
        hostId: user.uid,
        quizId: quiz.id,
        title: quiz.title,
        solo,
      });
      await joinRoom(room.roomId, user.uid, user.displayName || "Host", true);
      router.push(solo ? `/room/${room.code}/play` : `/room/${room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start.");
      setBusy(false);
    }
  }

  if (error && !quiz) {
    return <p className="rounded-[2rem] bg-white p-8 font-bold shadow-card">{error}</p>;
  }
  if (!quiz) {
    return <p className="py-12 text-center font-bold text-midnight/70">Loading quiz…</p>;
  }

  const mcqCount = quiz.questions.filter((q) => q.type === "mcq").length;
  const tfCount = quiz.questions.filter((q) => q.type === "tf").length;
  const blankCount = quiz.questions.filter((q) => q.type === "blank").length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-1.5 text-sm font-black text-french hover:underline"
      >
        ← Back to quizzes
      </Link>

      <div className="rounded-[2rem] bg-white p-8 shadow-card">
        <div className="inline-flex items-center gap-2 rounded-full bg-wheat px-4 py-1 text-xs font-black uppercase tracking-wider text-midnight">
          <span>Quiz Ready</span>
          <span>•</span>
          <span>{quiz.questionCount} Questions</span>
        </div>

        <h1 className="mt-4 text-3xl font-black text-midnight sm:text-4xl">{quiz.title}</h1>
        <p className="mt-2 text-base font-semibold text-midnight/70">
          Generated from your uploaded notes. Choose how you want to race!
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {mcqCount > 0 ? (
            <span className="rounded-2xl border-2 border-midnight/10 bg-seashell px-3 py-1.5 text-xs font-bold text-midnight">
              {mcqCount} Multiple Choice
            </span>
          ) : null}
          {tfCount > 0 ? (
            <span className="rounded-2xl border-2 border-midnight/10 bg-seashell px-3 py-1.5 text-xs font-bold text-midnight">
              {tfCount} True / False
            </span>
          ) : null}
          {blankCount > 0 ? (
            <span className="rounded-2xl border-2 border-midnight/10 bg-seashell px-3 py-1.5 text-xs font-bold text-midnight">
              {blankCount} Fill in the blank
            </span>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm font-bold text-red-700">{error}</p> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col justify-between rounded-2xl border-2 border-french/20 bg-french/5 p-5">
            <div>
              <h2 className="text-lg font-black text-midnight">Multiplayer Race</h2>
              <p className="mt-1 text-xs font-semibold text-midnight/70">
                Get a 6-letter room code. All participants join and start together once you begin.
              </p>
            </div>
            <Button
              className="mt-4 w-full"
              disabled={busy}
              onClick={() => void hostOrSolo(false)}
            >
              {busy ? "Starting…" : "Host a room"}
            </Button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border-2 border-wheat bg-wheat/20 p-5">
            <div>
              <h2 className="text-lg font-black text-midnight">Solo Practice</h2>
              <p className="mt-1 text-xs font-semibold text-midnight/70">
                Jump right in solo against the clock. Time-weighted active recall practice.
              </p>
            </div>
            <Button
              variant="wheat"
              className="mt-4 w-full"
              disabled={busy}
              onClick={() => void hostOrSolo(true)}
            >
              {busy ? "Starting…" : "Play solo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
