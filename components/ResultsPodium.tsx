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

  const podiumGridClass =
    top.length === 1
      ? "max-w-xs mx-auto"
      : top.length === 2
      ? "grid grid-cols-2 max-w-md mx-auto items-end gap-2.5 sm:gap-4"
      : "grid grid-cols-3 max-w-2xl mx-auto items-end gap-2 sm:gap-4";

  return (
    <div className="space-y-6 sm:space-y-8">
      {top.length > 0 ? (
        <div className={podiumGridClass}>
          {reorderPodium(top).map((player, visualIndex) => {
            const place = ranked.indexOf(player) + 1;
            const height =
              place === 1 ? "h-16 sm:h-36" : place === 2 ? "h-12 sm:h-28" : "h-8 sm:h-20";
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
                className={`group rounded-[1.25rem] sm:rounded-[1.75rem] bg-white p-2.5 sm:p-4 text-center shadow-card transition hover:-translate-y-1 hover:shadow-lg active:translate-y-0 cursor-pointer min-w-0 ${
                  top.length === 3 && visualIndex === 1 ? "sm:order-none" : ""
                }`}
                title="Click to view racer profile"
              >
                <p className="text-xs sm:text-sm font-extrabold uppercase text-french">#{place}</p>
                <div className="mt-1 sm:mt-2 flex justify-center">
                  <Avatar id={player.avatarId} size="md" showRing className="sm:h-16 sm:w-16" />
                </div>
                <p className="mt-1 sm:mt-2 truncate text-xs sm:text-base font-extrabold text-midnight group-hover:text-french transition-colors">
                  {player.displayName}
                </p>
                <p className="text-base sm:text-2xl font-black text-french">{player.score ?? 0}</p>
                <div
                  className={`mx-auto mt-2 sm:mt-3 w-full rounded-t-[0.875rem] sm:rounded-t-[1.5rem] bg-wheat flex items-center justify-center font-black text-midnight/35 text-xs sm:text-base ${height}`}
                >
                  #{place}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white p-5 sm:p-8 text-center shadow-card">
          <p className="font-bold text-sm sm:text-base text-midnight/70">Waiting for the first finish…</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-[1.75rem] sm:rounded-[2rem] bg-white shadow-card">
        <table className="w-full text-left">
          <thead className="bg-wheat/70 text-xs sm:text-sm font-extrabold uppercase text-midnight">
            <tr>
              <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-center sm:text-left w-12 sm:w-16">Rank</th>
              <th className="px-2 sm:px-4 py-2.5 sm:py-3">Player</th>
              <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-right sm:text-left">Score</th>
              <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-right sm:text-left">Time</th>
            </tr>
          </thead>
          <tbody className="text-xs sm:text-sm">
            {ranked.map((player, index) => (
              <tr
                key={player.id}
                className={player.id === currentUid ? "bg-powder/30 font-extrabold" : "border-t border-seashell"}
              >
                <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-center sm:text-left font-bold text-midnight/80">
                  {index + 1}
                </td>
                <td className="px-2 sm:px-4 py-2.5 sm:py-3">
                  <button
                    type="button"
                    onClick={() =>
                      openProfile(player.id, {
                        name: player.displayName,
                        avatarId: player.avatarId,
                      })
                    }
                    className="flex items-center gap-1.5 sm:gap-2.5 text-left font-extrabold text-midnight hover:text-french transition-colors cursor-pointer min-w-0"
                    title="Click to view racer profile"
                  >
                    <Avatar id={player.avatarId} size="xs" showRing />
                    <span className="truncate max-w-[95px] xs:max-w-[130px] sm:max-w-none">{player.displayName}</span>
                    {player.id === currentUid ? (
                      <span className="shrink-0 rounded-full bg-french/15 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-french">
                        you
                      </span>
                    ) : null}
                  </button>
                </td>
                <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-black text-french text-right sm:text-left">
                  {player.score ?? 0}
                </td>
                <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-right sm:text-left font-semibold text-midnight/80 whitespace-nowrap">
                  {startedAt && player.finishedAt ? formatElapsed(player.finishedAt - startedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {waiting.length > 0 ? (
        <p className="text-center font-bold text-xs sm:text-sm text-midnight/70">
          Still racing: {waiting.map((player) => player.displayName).join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function reorderPodium<T>(top: T[]): T[] {
  if (top.length === 3) return [top[1], top[0], top[2]];
  return top;
}
