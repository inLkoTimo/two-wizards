"use client";

export function RevealPanel({
  player1Name,
  player2Name,
  bid1,
  bid2,
}: {
  player1Name: string;
  player2Name: string;
  bid1: number | null;
  bid2: number | null;
}) {
  return (
    <div className="rounded-3xl border border-purple-300/20 bg-black/60 px-6 py-6 text-center backdrop-blur sm:px-10 sm:py-8">
      <div className="text-4xl sm:text-5xl">✨</div>

      <h2 className="mt-2 text-2xl font-black sm:text-3xl">
        Ansagen enthüllt
      </h2>

      <div className="mt-4 flex justify-center gap-3">
        <div className="rounded-2xl bg-purple-500/10 px-5 py-3 sm:px-6 sm:py-4">
          <div className="max-w-[7rem] truncate text-[10px] text-purple-300">
            {player1Name}
          </div>

          <div className="text-2xl font-black sm:text-3xl">{bid1}</div>
        </div>

        <div className="rounded-2xl bg-blue-500/10 px-5 py-3 sm:px-6 sm:py-4">
          <div className="max-w-[7rem] truncate text-[10px] text-blue-300">
            {player2Name}
          </div>

          <div className="text-2xl font-black sm:text-3xl">{bid2}</div>
        </div>
      </div>
    </div>
  );
}
