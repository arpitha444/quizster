"use client";

import { Avatar } from "@/components/Avatar";
import { useProfileModal } from "@/components/ProfileModalProvider";
import { formatElapsed, rankPlayers } from "@/lib/scoring";
import type { PlayerDoc } from "@/lib/types";

export function ResultsPodium({
  players,
  startedAt,
  currentUid,
}: {
  players: (PlayerDoc & { id: string })[];
  startedAt: number | null;
  currentUid?: string;
}) {
  const { openProfile } = useProfileModal();
  const finished = players.filter((player) => player.finishedAt);
  const ranked = rankPlayers(finished);
  const waiting = players.filter((player) => !player.finishedAt);
  const top = ranked.slice(0, 3);

  return (
    <div className="space-y-8">
      {top.length > 0 ? (
        <div className="grid items-end gap-4 sm:grid-cols-3">
          {reorderPodium(top).map((player, visualIndex) => {
            const place = ranked.indexOf(player) + 1;
            const height = place === 1 ? "h-40" : place === 2 ? "h-32" : "h-24";
            return (
              <button
                key={player.id}
                type="button"
                onClick={() =>
                  openProfile(player.id, {
                    name: player.displayName,
                    avatarId: player.avatarId,
                  })
                }
                className={`group rounded-[1.75rem] bg-white p-4 text-center shadow-card transition hover:-translate-y-1 hover:shadow-lg active:translate-y-0 cursor-pointer ${
                  visualIndex === 1 ? "sm:order-none" : ""
                }`}
                title="Click to view racer profile"
              >
                <p className="text-sm font-extrabold uppercase text-french">#{place}</p>
                <div className="mt-2 flex justify-center">
                  <Avatar id={player.avatarId} size="lg" showRing />
                </div>
                <p className="mt-2 truncate font-extrabold text-midnight group-hover:text-french transition-colors">
                  {player.displayName}
                </p>
                <p className="text-2xl font-black text-french">{player.score ?? 0}</p>
                <div className={`mx-auto mt-3 w-full rounded-t-[1.5rem] bg-wheat ${height}`} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-card">
          <p className="font-bold text-midnight/70">Waiting for the first finish…</p>
        </div>
      )}

      <div className="overflow-hidden rounded-[2rem] bg-white shadow-card">
        <table className="w-full text-left">
          <thead className="bg-wheat/70 text-sm font-extrabold uppercase text-midnight">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((player, index) => (
              <tr
                key={player.id}
                className={player.id === currentUid ? "bg-powder/30 font-extrabold" : "border-t border-seashell"}
              >
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      openProfile(player.id, {
                        name: player.displayName,
                        avatarId: player.avatarId,
                      })
                    }
                    className="flex items-center gap-2.5 text-left font-extrabold text-midnight hover:text-french transition-colors cursor-pointer"
                    title="Click to view racer profile"
                  >
                    <Avatar id={player.avatarId} size="xs" showRing />
                    <span className="truncate">{player.displayName}</span>
                    {player.id === currentUid ? (
                      <span className="rounded-full bg-french/15 px-1.5 py-0.5 text-[10px] font-black text-french">
                        you
                      </span>
                    ) : null}
                  </button>
                </td>
                <td className="px-4 py-3">{player.score ?? 0}</td>
                <td className="px-4 py-3">
                  {startedAt && player.finishedAt ? formatElapsed(player.finishedAt - startedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {waiting.length > 0 ? (
        <p className="text-center font-bold text-midnight/70">
          Still racing: {waiting.map((player) => player.displayName).join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function reorderPodium<T>(top: T[]): T[] {
  if (top.length < 3) return top;
  return [top[1], top[0], top[2]];
}
