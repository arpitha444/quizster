"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { QuestionReview } from "@/components/QuestionReview";
import { ResultsPodium } from "@/components/ResultsPodium";
import { useAuth } from "@/lib/auth-context";
import { rankPlayers } from "@/lib/scoring";
import { downloadQuizPdf } from "@/lib/pdf-generator";
import { useRoomByCode } from "@/lib/use-room";
import { recordGroupQuizFinish } from "@/lib/user-profile";

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

  useEffect(() => {
    if (!room || !user) return;
    // Only record for multiplayer rooms with 2 or more players
    if (room.solo || players.length < 2) return;

    // Check if every player has finished
    const allFinished = players.length > 0 && players.every((p) => Boolean(p.finishedAt));
    if (!allFinished) return;

    const finishedPlayers = players.filter((p) => Boolean(p.finishedAt));
    const ranked = rankPlayers(finishedPlayers);
    const myRank = ranked.findIndex((p) => p.id === user.uid) + 1;
    if (myRank > 0) {
      void recordGroupQuizFinish({
        uid: user.uid,
        roomId: room.id,
        rank: myRank,
        totalPlayers: players.length,
      });
    }
  }, [players, room, user]);

  if (loading || !room) {
    return <p className="py-12 text-center font-bold">{error || "Loading results…"}</p>;
  }

  const myPlayer = players.find((player) => player.id === user?.uid);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[2rem] bg-white p-5 sm:p-6 text-center shadow-card">
        <p className="font-extrabold uppercase tracking-widest text-french text-xs sm:text-sm">Finish line</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black text-midnight">{room.title}</h1>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-base font-semibold text-midnight/70">Ranked by score, then by who finished first.</p>
      </div>

      <ResultsPodium players={players} startedAt={room.startedAt} currentUid={user?.uid} />

      {quiz && myPlayer?.finishedAt ? (
        <QuestionReview
          questions={quiz.questions}
          answers={myPlayer.answers ?? {}}
          quizTitle={room.title}
          playerName={myPlayer.displayName || user?.displayName || "Player"}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {quiz && myPlayer?.finishedAt ? (
          <button
            type="button"
            onClick={() =>
              downloadQuizPdf({
                quizTitle: room.title,
                playerName: myPlayer.displayName || user?.displayName || "Player",
                questions: quiz.questions,
                answers: myPlayer.answers ?? {},
              })
            }
            className="inline-flex items-center gap-2 rounded-full border-2 border-french/25 bg-white px-5 sm:px-6 py-2.5 sm:py-3 font-extrabold text-french shadow-card transition hover:-translate-y-0.5 hover:bg-french hover:text-white active:translate-y-0 cursor-pointer text-sm sm:text-base"
          >
            <span>📥</span>
            <span>Download Quiz PDF</span>
          </button>
        ) : null}
        <Link
          href="/home"
          className="inline-block rounded-full bg-french px-5 sm:px-6 py-2.5 sm:py-3 font-extrabold text-white shadow-bubble transition hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
