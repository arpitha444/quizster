"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { QuizForm } from "@/components/QuizForm";
import { useAuth } from "@/lib/auth-context";
import { formatElapsed, scoreQuiz } from "@/lib/scoring";
import { submitRun } from "@/lib/rooms";
import { useRoomByCode } from "@/lib/use-room";

export default function PlayPage() {
  return (
    <AuthGuard>
      <PlayInner />
    </AuthGuard>
  );
}

function PlayInner() {
  const params = useParams<{ code: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { room, players, quiz, error, loading } = useRoomByCode(params.code);
  const [now, setNow] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!room) return;
    if (room.status === "lobby") {
      router.replace(`/room/${room.code}`);
    }
  }, [room, router]);

  useEffect(() => {
    if (!room || !user) return;
    const me = players.find((player) => player.id === user.uid);
    if (me?.finishedAt) {
      router.replace(`/room/${room.code}/results`);
    }
  }, [players, room, router, user]);

  if (loading || !room || !quiz) {
    return <p className="py-12 text-center font-bold">{error || "Loading the quiz…"}</p>;
  }

  const startedAt = room.startedAt ?? now;
  const playQuestions = quiz.questions.map((question) => ({
    ...question,
    answer: "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] bg-white px-6 py-4 shadow-card">
        <div>
          <p className="text-sm font-extrabold uppercase text-french">Race</p>
          <h1 className="text-2xl font-black text-midnight">{room.title}</h1>
        </div>
        <div className="rounded-full bg-wheat px-5 py-2 text-2xl font-black text-midnight">
          {formatElapsed(now - startedAt)}
        </div>
      </div>
      <QuizForm
        questions={playQuestions}
        submitting={submitting}
        onSubmit={async (answers) => {
          if (!user) return;
          setSubmitting(true);
          const { score } = scoreQuiz(quiz.questions, answers);
          await submitRun(room.id, user.uid, { answers, score });
          router.push(`/room/${room.code}/results`);
        }}
      />
    </div>
  );
}
