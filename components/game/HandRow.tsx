"use client";

import { CardView } from "./PlayingCard";
import type { Card } from "@/lib/game/types";

export function HandRow({
  hand,
  isPlayable,
  onPlay,
}: {
  hand: Card[];
  isPlayable: (card: Card) => boolean;
  onPlay: (card: Card) => void;
}) {
  return (
    <div className="w-full overflow-x-auto pb-1 pt-3 [scrollbar-width:thin]">
      <div className="mx-auto flex w-fit items-end gap-1.5 px-3 sm:gap-2.5">
        {hand.map((card) => {
          const playable = isPlayable(card);

          return (
            <CardView
              key={card.id}
              card={card}
              size="hand"
              playable={playable}
              onClick={() => onPlay(card)}
            />
          );
        })}
      </div>
    </div>
  );
}
