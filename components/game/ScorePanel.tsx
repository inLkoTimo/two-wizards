"use client";

import type { PlayerMap, RoundResult } from "@/lib/game/types";

export function ScorePanel({
  history,
  scores,
  player1Name,
  player2Name,
}: {
  history: RoundResult[];
  scores: PlayerMap<number>;
  player1Name: string;
  player2Name: string;
}) {
  return (
    <aside className="flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090d12]">
      <div className="shrink-0 border-b border-white/10 px-4 py-2.5 text-center text-sm font-black text-amber-200">
        Punktübersicht
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {history.length === 0 && (
          <p className="p-4 text-center text-xs text-slate-600">
            Nach der ersten Runde steht hier die Abrechnung.
          </p>
        )}

        {history.map((row) => (
          <div
            key={row.round}
            className="border-b border-white/5 px-3 py-3 text-xs"
          >
            <div className="font-bold text-purple-200">
              Runde {row.round}
              <span className="ml-1 font-normal text-slate-600">
                · {row.cards} {row.cards === 1 ? "Karte" : "Karten"}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="min-w-0">
                <div className="truncate text-[9px] text-slate-600">
                  {player1Name}
                </div>

                <div>
                  {row.bid1} → {row.tricks1}
                </div>

                <div
                  className={
                    row.points1 >= 0 ? "text-emerald-300" : "text-red-300"
                  }
                >
                  {row.points1 > 0 ? "+" : ""}
                  {row.points1}
                </div>
              </div>

              <div className="min-w-0">
                <div className="truncate text-[9px] text-slate-600">
                  {player2Name}
                </div>

                <div>
                  {row.bid2} → {row.tricks2}
                </div>

                <div
                  className={
                    row.points2 >= 0 ? "text-emerald-300" : "text-red-300"
                  }
                >
                  {row.points2 > 0 ? "+" : ""}
                  {row.points2}
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-600">Gesamt</div>
                <div>{row.total1}</div>
                <div>{row.total2}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-xl bg-purple-500/10 p-3">
            <div className="truncate text-[10px] text-purple-300">
              {player1Name}
            </div>

            <div className="text-2xl font-black">{scores.player1}</div>
          </div>

          <div className="min-w-0 rounded-xl bg-blue-500/10 p-3">
            <div className="truncate text-[10px] text-blue-300">
              {player2Name}
            </div>

            <div className="text-2xl font-black">{scores.player2}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
