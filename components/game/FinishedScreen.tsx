"use client";

import type { GameRow, GameState } from "@/lib/game/types";

export function FinishedScreen({
  game,
  state,
  onRestart,
}: {
  game: GameRow;
  state: GameState;
  onRestart: () => void;
}) {
  const draw = state.scores.player1 === state.scores.player2;

  const winner =
    state.scores.player1 > state.scores.player2
      ? game.player1_name
      : game.player2_name ?? "Wizard 2";

  return (
    <main className="min-h-[100dvh] bg-[#05080d] text-white">
      <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl rounded-[1.75rem] border border-amber-300/20 bg-white/[0.04] p-6 text-center sm:p-8">
          <div className="text-6xl sm:text-7xl">{draw ? "🤝" : "🏆"}</div>

          <div className="mt-5 text-[11px] font-black uppercase tracking-[0.3em] text-amber-200 sm:text-sm">
            Spiel beendet
          </div>

          <h1 className="mt-2 text-3xl font-black sm:text-5xl">
            {draw ? "Unentschieden!" : `${winner} gewinnt!`}
          </h1>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-3xl bg-purple-500/10 p-4 sm:p-6">
              <div className="truncate text-purple-300">
                {game.player1_name}
              </div>

              <div className="mt-1 text-4xl font-black sm:text-5xl">
                {state.scores.player1}
              </div>
            </div>

            <div className="rounded-3xl bg-blue-500/10 p-4 sm:p-6">
              <div className="truncate text-blue-300">
                {game.player2_name ?? "Wizard 2"}
              </div>

              <div className="mt-1 text-4xl font-black sm:text-5xl">
                {state.scores.player2}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onRestart}
            className="mt-7 w-full rounded-2xl bg-white px-6 py-4 font-black text-slate-950 hover:bg-amber-100"
          >
            Noch einmal spielen ✨
          </button>
        </div>
      </div>
    </main>
  );
}
