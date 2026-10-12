"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { useProfileModal } from "@/components/ProfileModalProvider";
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
  const { user, profile } = useAuth();
  const { openProfile } = useProfileModal();
  const router = useRouter();
  const { room, players, error, loading } = useRoomByCode(params.code);

  useEffect(() => {
    if (!user || !room) return;
    const already = players.some((player) => player.id === user.uid);
    if (!already) {
      void joinRoom(
        room.id,
        user.uid,
        profile?.displayName || user.displayName || "Player",
        room.hostId === user.uid,
        profile?.avatarId || "yellow",
      );
    }
  }, [players, profile, room, user]);

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
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[2rem] bg-white p-5 sm:p-8 text-center shadow-card">
        <p className="font-extrabold uppercase tracking-widest text-french text-xs sm:text-sm">Room code</p>
        <p className="mt-2 text-3xl sm:text-5xl font-black tracking-[0.15em] sm:tracking-[0.25em] text-midnight">{room.code}</p>
        <p className="mt-2 sm:mt-3 font-semibold text-sm sm:text-base text-midnight/70">{room.title}</p>
        <p className="mt-1 text-xs sm:text-sm font-bold text-midnight/60">Everyone waits here until the host starts.</p>
        {isHost ? (
          <Button className="mt-5 sm:mt-6 w-full sm:w-auto" disabled={players.length < 1} onClick={() => void startRoom(room.id)}>
            Start the race
          </Button>
        ) : (
          <p className="mt-5 sm:mt-6 rounded-full bg-wheat px-4 py-2 font-extrabold text-sm sm:text-base text-midnight">Waiting for the host…</p>
        )}
      </div>
      <div className="rounded-[2rem] bg-white p-5 sm:p-6 shadow-card">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-black text-midnight text-base sm:text-lg">Players ({players.length})</h2>
          <span className="text-xs font-bold text-midnight/50">Click any racer to view profile</span>
        </div>
        {players.length === 0 ? (
          <p className="mt-3 font-bold text-midnight/60">No one has joined yet.</p>
        ) : (
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {players.map((player) => (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() =>
                    openProfile(player.id, {
                      name: player.displayName,
                      avatarId: player.avatarId,
                    })
                  }
                  className="group flex w-full items-center justify-between rounded-2xl bg-seashell px-4 py-3 font-extrabold text-midnight transition hover:-translate-y-0.5 hover:bg-wheat/70 hover:shadow-sm active:translate-y-0 text-left border border-midnight/5"
                  title="Click to view racer profile"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="shrink-0">
                      <Avatar id={player.avatarId} size="sm" showRing />
                    </div>
                    <span className="truncate text-sm sm:text-base">{player.displayName}</span>
                    {player.id === user?.uid ? (
                      <span className="shrink-0 rounded-full bg-french/15 px-2 py-0.5 text-[10px] font-black text-french">
                        you
                      </span>
                    ) : null}
                    {player.isHost ? (
                      <span className="shrink-0 rounded-full bg-wheat px-2 py-0.5 text-[10px] font-black text-midnight">
                        host
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs font-black text-french opacity-0 group-hover:opacity-100 transition-opacity">
                    Profile →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
