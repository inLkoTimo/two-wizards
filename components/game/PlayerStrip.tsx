"use client";

import { TrickPile } from "./TrickPile";

/**
 * Namensleiste eines Spielers mit Stichstapel. Wer am Zug ist,
 * bekommt einen leuchtenden Rahmen - sichtbar auf jedem Geraet.
 */
export function PlayerStrip({
  name,
  isMe,
  subline,
  tricks,
  isActive,
  bump,
  accent,
}: {
  name: string;
  isMe: boolean;
  subline: string;
  tricks: number;
  isActive: boolean;
  bump: boolean;
  accent: "purple" | "blue";
}) {
  const ring =
    accent === "purple"
      ? "border-purple-300/70 shadow-[0_0_0_2px_rgba(216,180,254,0.2)]"
      : "border-sky-300/70 shadow-[0_0_0_2px_rgba(125,211,252,0.2)]";

  return (
    <div
      className={[
        "flex min-w-0 flex-1 items-center gap-2 rounded-2xl border bg-black/30 px-2.5 py-1.5 transition-all duration-300 sm:gap-3 sm:px-4 sm:py-2",
        isActive ? ring : "border-white/10",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold sm:text-base">
            {isMe ? `${name} (Du)` : name}
          </span>

          {isActive && (
            <span className="shrink-0 animate-pulse text-[9px] font-black uppercase tracking-[0.15em] text-amber-300 sm:text-[10px]">
              am Zug
            </span>
          )}
        </div>

        <div className="truncate text-[10px] uppercase tracking-[0.15em] text-white/40">
          {subline}
        </div>
      </div>

      <TrickPile count={tricks} highlight={bump} label="Stiche" />
    </div>
  );
}
