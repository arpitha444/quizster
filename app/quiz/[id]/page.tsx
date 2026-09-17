"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { QuestionPreview } from "@/components/QuestionPreview";
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

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-6 shadow-card">
        <h1 className="text-3xl font-black text-midnight">{quiz.title}</h1>
        <p className="mt-2 font-semibold text-midnight/70">{quiz.questionCount} questions · answers highlighted for the host</p>
        {error ? <p className="mt-3 text-sm font-bold text-red-700">{error}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => void hostOrSolo(false)}>
            Host a room
          </Button>
          <Button variant="wheat" disabled={busy} onClick={() => void hostOrSolo(true)}>
            Play solo
          </Button>
        </div>
      </div>
      <QuestionPreview questions={quiz.questions} />
    </div>
  );
}
