"use client";

/**
 * Ansagephase. Beide sagen gleichzeitig an - deshalb steht hier
 * gross, wer die Runde eroeffnet und ob der andere schon
 * angesagt hat. Niemand muss sich mehr merken, wer dran ist.
 */
export function BiddingPanel({
  handSize,
  myBid,
  opponentHasBid,
  opponentName,
  iStart,
  onBid,
}: {
  handSize: number;
  myBid: number | null;
  opponentHasBid: boolean;
  opponentName: string;
  iStart: boolean;
  onBid: (bid: number) => void;
}) {
  return (
    <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-black/50 p-4 text-center backdrop-blur sm:p-6">
      <div className="text-3xl sm:text-4xl">🔮</div>

      <h2 className="mt-2 text-xl font-black sm:text-3xl">
        Wie viele Stiche schaffst du?
      </h2>

      <div
        className={[
          "mx-auto mt-3 w-fit rounded-2xl border px-4 py-2",
          iStart
            ? "border-emerald-300/40 bg-emerald-500/10"
            : "border-amber-300/30 bg-amber-500/10",
        ].join(" ")}
      >
        <div className="text-[9px] uppercase tracking-[0.25em] text-white/40">
          Erste Karte dieser Runde
        </div>

        <div className="mt-0.5 text-sm font-black sm:text-base">
          {iStart ? "✨ Du spielst an" : `🪄 ${opponentName} spielt an`}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div
          className={[
            "rounded-xl border px-3 py-2",
            myBid !== null
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-white/10 bg-white/5 text-slate-300",
          ].join(" ")}
        >
          <div className="text-[9px] uppercase tracking-[0.2em] opacity-60">
            Du
          </div>

          <div className="mt-0.5 font-bold">
            {myBid !== null ? `${myBid} angesagt ✅` : "wählst noch ⏳"}
          </div>
        </div>

        <div
          className={[
            "rounded-xl border px-3 py-2",
            opponentHasBid
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-white/10 bg-white/5 text-slate-300",
          ].join(" ")}
        >
          <div className="truncate text-[9px] uppercase tracking-[0.2em] opacity-60">
            {opponentName}
          </div>

          <div className="mt-0.5 font-bold">
            {opponentHasBid ? "hat angesagt ✅" : "überlegt noch ⏳"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-11 sm:gap-2">
        {Array.from({ length: handSize + 1 }, (_, value) => (
          <button
            key={value}
            type="button"
            onClick={() => onBid(value)}
            className={[
              "rounded-xl border py-2.5 text-base font-black transition sm:py-3 sm:text-lg",
              myBid === value
                ? "border-purple-300 bg-purple-500/30 text-white"
                : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10",
            ].join(" ")}
          >
            {value}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        {myBid === null
          ? "Tippe auf deine Zahl."
          : "Du kannst deine Ansage noch ändern, bis beide angesagt haben."}
      </p>
    </div>
  );
}
