"use client";

import { CardView } from "./PlayingCard";
import { TIMING } from "@/lib/game/constants";
import type { TrickAnimation } from "@/lib/hooks/useTrickAnimation";
import type { PlayedCard, Player } from "@/lib/game/types";

/**
 * Die Tischmitte. Zeigt die gespielten Karten - und zwar solange
 * die lokale Animation laeuft, auch dann noch, wenn der geteilte
 * Spielstand den Stich schon abgeraeumt hat.
 */
export function TrickArea({
  trick,
  animation,
  me,
  opponentName,
  winnerName,
}: {
  trick: PlayedCard[];
  animation: TrickAnimation | null;
  me: Player | null;
  opponentName: string;
  winnerName: string | null;
}) {
  const cards = animation ? animation.cards : trick;
  const flying = animation?.stage === "fly";
  const towardsMe = animation ? animation.winner === me : false;

  const motion: React.CSSProperties = flying
    ? {
        transform: towardsMe
          ? "translate3d(0, 30vh, 0) scale(0.35)"
          : "translate3d(0, -30vh, 0) scale(0.35)",
        opacity: 0,
        transition: `transform ${TIMING.trickFly}ms cubic-bezier(0.4, 0, 1, 1), opacity ${TIMING.trickFly}ms ease-in`,
      }
    : {
        transform: "translate3d(0, 0, 0) scale(1)",
        opacity: 1,
        transition: "transform 220ms ease-out, opacity 220ms ease-out",
      };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3">
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "clamp(4rem, 17vh, 10rem)" }}
      >
        {cards.length === 0 ? (
          <div
            className="flex items-center justify-center rounded-xl border border-dashed border-amber-500/25 opacity-30"
            style={{
              height: "clamp(3.6rem, 15vh, 9rem)",
              aspectRatio: "5 / 7",
              fontSize: "clamp(1.2rem, 4vh, 2.2rem)",
            }}
          >
            🃏
          </div>
        ) : (
          <div className="flex items-end justify-center" style={motion}>
            {cards.map((played, index) => (
              <div
                key={played.card.id}
                className={[
                  "relative text-center",
                  index === 1 ? "-ml-6 sm:-ml-10" : "",
                ].join(" ")}
                style={{
                  zIndex: index + 1,
                  transform: index === 0 ? "rotate(-5deg)" : "rotate(5deg)",
                }}
              >
                <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-100/60 sm:text-[10px]">
                  {played.player === me ? "Du" : opponentName}
                </div>

                <CardView card={played.card} size="table" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ergebnis begleitet die Karten, statt sie zu ersetzen. */}
      <div className="h-7">
        {animation && winnerName && (
          <div
            className={[
              "rounded-full border border-amber-300/30 bg-black/60 px-4 py-1.5 text-[11px] font-bold text-amber-100 transition-opacity duration-300 sm:text-xs",
              flying ? "opacity-0" : "opacity-100",
            ].join(" ")}
          >
            🏆 Stich für {animation.winner === me ? "dich" : winnerName}
          </div>
        )}
      </div>
    </div>
  );
}
