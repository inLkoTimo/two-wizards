"use client";

import { SUIT_INFO } from "@/lib/game/constants";
import type { Card } from "@/lib/game/types";

// Karten werden nicht in festen Pixeln gemessen, sondern an der
// Hoehe des Fensters (vh) - begrenzt nach unten und oben. Dadurch
// passt derselbe Kartentisch auf ein Handy im Querformat, auf ein
// iPad und auf einen grossen Monitor, ohne Sonderfaelle.
export type CardSize = "mini" | "table" | "hand";

const SIZES: Record<
  CardSize,
  { height: string; value: string; glyph: string; caption: string }
> = {
  mini: {
    height: "clamp(2.1rem, 5.5vh, 3.5rem)",
    value: "clamp(0.7rem, 1.9vh, 1.05rem)",
    glyph: "clamp(0.8rem, 2.2vh, 1.3rem)",
    caption: "0",
  },
  table: {
    height: "clamp(3.6rem, 15vh, 9rem)",
    value: "clamp(1.1rem, 5vh, 3rem)",
    glyph: "clamp(1.3rem, 5vh, 2.6rem)",
    caption: "clamp(0.4rem, 1.1vh, 0.62rem)",
  },
  hand: {
    height: "clamp(3.4rem, 13.5vh, 10rem)",
    value: "clamp(1.1rem, 4.6vh, 3rem)",
    glyph: "clamp(1.3rem, 4.6vh, 2.6rem)",
    caption: "clamp(0.4rem, 1.05vh, 0.62rem)",
  },
};

const CARD_RATIO = "5 / 7";

function frameStyle(size: CardSize): React.CSSProperties {
  return { height: SIZES[size].height, aspectRatio: CARD_RATIO };
}

function frameClasses(playable: boolean, extra: string) {
  return [
    "group relative shrink-0 select-none overflow-hidden rounded-xl border-2 text-white shadow-xl transition duration-200 sm:rounded-2xl",
    extra,
    playable
      ? "cursor-pointer hover:-translate-y-3 hover:scale-[1.05] hover:border-white focus-visible:-translate-y-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 active:-translate-y-1"
      : "cursor-default",
  ].join(" ");
}

export function CardBack({ size = "table" }: { size?: CardSize }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg border border-amber-400/25 bg-gradient-to-br from-slate-950 via-slate-900 to-black shadow-lg"
      style={frameStyle(size)}
    >
      <div className="absolute inset-[2px] rounded-md border border-amber-500/20" />

      <div
        className="flex h-full items-center justify-center opacity-60"
        style={{ fontSize: SIZES[size].glyph }}
      >
        ✨
      </div>
    </div>
  );
}

export function CardView({
  card,
  size = "table",
  playable = false,
  onClick,
}: {
  card: Card;
  size?: CardSize;
  playable?: boolean;
  onClick?: () => void;
}) {
  const interactive = playable && Boolean(onClick);
  const metrics = SIZES[size];
  const showCaption = size !== "mini";

  if (card.type === "normal") {
    const info = SUIT_INFO[card.suit];

    return (
      <button
        type="button"
        disabled={!interactive}
        onClick={onClick}
        aria-label={`${info.name} ${card.value}`}
        style={frameStyle(size)}
        className={frameClasses(
          interactive,
          `border-white/30 bg-gradient-to-br ${info.gradient}`,
        )}
      >
        <div className="absolute inset-[3px] rounded-[inherit] border border-white/20" />

        <div
          className="absolute -right-2 -top-3 opacity-20"
          style={{ fontSize: `calc(${metrics.value} * 1.6)` }}
        >
          {info.emoji}
        </div>

        <div className="relative flex h-full flex-col items-center justify-center">
          <div className="font-black" style={{ fontSize: metrics.value }}>
            {card.value}
          </div>

          {showCaption && (
            <div
              className="mt-0.5 font-bold uppercase tracking-[0.15em] text-white/70"
              style={{ fontSize: metrics.caption }}
            >
              {info.name}
            </div>
          )}
        </div>
      </button>
    );
  }

  const isWizard = card.type === "wizard";

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      aria-label={isWizard ? "Wizard" : "Hexe"}
      style={frameStyle(size)}
      className={frameClasses(
        interactive,
        isWizard
          ? "border-violet-300/60 bg-gradient-to-br from-slate-950 via-violet-900 to-indigo-950"
          : "border-fuchsia-300/50 bg-gradient-to-br from-black via-fuchsia-950 to-slate-950",
      )}
    >
      <div className="absolute inset-[3px] rounded-[inherit] border border-white/15" />

      <div className="relative flex h-full flex-col items-center justify-center">
        <div style={{ fontSize: metrics.glyph }}>{isWizard ? "🧙" : "🧙‍♀️"}</div>

        {showCaption && (
          <div
            className="mt-0.5 font-black uppercase tracking-widest"
            style={{ fontSize: `calc(${metrics.caption} * 1.35)` }}
          >
            {isWizard ? "Wizard" : "Hexe"}
          </div>
        )}
      </div>
    </button>
  );
}
