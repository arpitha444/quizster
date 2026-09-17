"use client";

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
              <div
                key={player.id}
                className={`rounded-[1.75rem] bg-white p-4 text-center shadow-card ${visualIndex === 1 ? "sm:order-none" : ""}`}
              >
                <p className="text-sm font-extrabold uppercase text-french">#{place}</p>
                <p className="mt-1 truncate font-extrabold text-midnight">{player.displayName}</p>
                <p className="text-2xl font-black text-french">{player.score ?? 0}</p>
                <div className={`mx-auto mt-3 w-full rounded-t-[1.5rem] bg-wheat ${height}`} />
              </div>
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
                <td className="px-4 py-3">{player.displayName}</td>
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
