"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { joinRoom, startRoom } from "@/lib/rooms";
import { useRoomByCode } from "@/lib/use-room";

export default function LobbyPage() {
  return (
    <AuthGuard>
      <LobbyInner />
    </AuthGuard>
  );
}

function LobbyInner() {
  const params = useParams<{ code: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { room, players, error, loading } = useRoomByCode(params.code);

  useEffect(() => {
    if (!user || !room) return;
    const already = players.some((player) => player.id === user.uid);
    if (!already) {
      void joinRoom(room.id, user.uid, user.displayName || "Player", room.hostId === user.uid);
    }
  }, [players, room, user]);

  useEffect(() => {
    if (!room || !user) return;
    const me = players.find((player) => player.id === user.uid);
    if (room.status === "playing") {
      router.replace(me?.finishedAt ? `/room/${room.code}/results` : `/room/${room.code}/play`);
    }
  }, [players, room, router, user]);

  if (loading) return <p className="py-12 text-center font-bold">Finding the lobby…</p>;
  if (error || !room) {
    return <p className="rounded-[2rem] bg-white p-8 font-bold shadow-card">{error || "Room missing."}</p>;
  }

  const isHost = user?.uid === room.hostId;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-card">
        <p className="font-extrabold uppercase tracking-widest text-french">Room code</p>
        <p className="mt-2 text-5xl font-black tracking-[0.25em] text-midnight">{room.code}</p>
        <p className="mt-3 font-semibold text-midnight/70">{room.title}</p>
        <p className="mt-1 text-sm font-bold text-midnight/60">Everyone waits here until the host starts.</p>
        {isHost ? (
          <Button className="mt-6" disabled={players.length < 1} onClick={() => void startRoom(room.id)}>
            Start the race
          </Button>
        ) : (
          <p className="mt-6 rounded-full bg-wheat px-4 py-2 font-extrabold text-midnight">Waiting for the host…</p>
        )}
      </div>
      <div className="rounded-[2rem] bg-white p-6 shadow-card">
        <h2 className="font-black text-midnight">Players ({players.length})</h2>
        {players.length === 0 ? (
          <p className="mt-3 font-bold text-midnight/60">No one has joined yet.</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {players.map((player) => (
              <li key={player.id} className="rounded-2xl bg-seashell px-4 py-3 font-extrabold text-midnight">
                {player.displayName}
                {player.isHost ? <span className="ml-2 text-sm text-french">host</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
