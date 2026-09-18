"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { QuestionReview } from "@/components/QuestionReview";
import { ResultsPodium } from "@/components/ResultsPodium";
import { useAuth } from "@/lib/auth-context";
import { useRoomByCode } from "@/lib/use-room";

export default function ResultsPage() {
  return (
    <AuthGuard>
      <ResultsInner />
    </AuthGuard>
  );
}

function ResultsInner() {
  const params = useParams<{ code: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { room, players, quiz, error, loading } = useRoomByCode(params.code);

  useEffect(() => {
    if (!room) return;
    if (room.status === "lobby") router.replace(`/room/${room.code}`);
  }, [room, router]);

  if (loading || !room) {
    return <p className="py-12 text-center font-bold">{error || "Loading results…"}</p>;
  }

  const myPlayer = players.find((player) => player.id === user?.uid);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-6 text-center shadow-card">
        <p className="font-extrabold uppercase tracking-widest text-french">Finish line</p>
        <h1 className="mt-2 text-3xl font-black text-midnight">{room.title}</h1>
        <p className="mt-2 font-semibold text-midnight/70">Ranked by score, then by who finished first.</p>
      </div>

      <ResultsPodium players={players} startedAt={room.startedAt} currentUid={user?.uid} />

      {quiz && myPlayer?.finishedAt ? (
        <QuestionReview questions={quiz.questions} answers={myPlayer.answers ?? {}} />
      ) : null}

      <div className="text-center pt-2">
        <Link href="/home" className="inline-block rounded-full bg-french px-6 py-3 font-extrabold text-white shadow-bubble">
          Back home
        </Link>
      </div>
    </div>
  );
}
