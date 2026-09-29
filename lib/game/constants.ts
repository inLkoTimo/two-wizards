import type { Suit } from "./types";

/** Muss identisch zur alten Version bleiben, damit beide
 *  Oberflaechen denselben Datensatz lesen koennen. */
export const STATE_VERSION = 6;

export const ROUND_SIZES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
];

export const TOTAL_ROUNDS = ROUND_SIZES.length;

export const SUITS: Suit[] = ["fire", "water", "air", "earth"];

export const REACTIONS = [
  "🍑",
  "❤️‍🩹",
  "💔",
  "🥹",
  "😶‍🌫️",
  "🫩",
  "🤮",
  "😈",
  "😭",
  "🤛",
  "😡",
  "🫦",
  "🦦",
];

export const SUIT_INFO: Record<
  Suit,
  { name: string; emoji: string; gradient: string; accent: string }
> = {
  fire: {
    name: "Feuer",
    emoji: "🔥",
    gradient: "from-red-950 via-red-700 to-orange-500",
    accent: "text-orange-200",
  },
  water: {
    name: "Wasser",
    emoji: "💧",
    gradient: "from-blue-950 via-blue-700 to-cyan-400",
    accent: "text-cyan-200",
  },
  air: {
    name: "Luft",
    emoji: "🌪️",
    gradient: "from-slate-950 via-slate-500 to-white",
    accent: "text-slate-200",
  },
  earth: {
    name: "Erde",
    emoji: "🪨",
    gradient: "from-stone-950 via-amber-900 to-yellow-700",
    accent: "text-amber-200",
  },
};

/** Alle Zeiten in Millisekunden.
 *  Die Animation eines Stichs laeuft bei jedem Client lokal ab,
 *  gestartet in dem Moment, in dem er den Stich zum ersten Mal
 *  sieht. Deshalb sieht auch der langsamere Client beide Karten
 *  vollstaendig - unabhaengig von Netz-Latenz und Uhrzeit. */
export const TIMING = {
  /** Wie lange die aufgedeckten Ansagen stehen bleiben. */
  reveal: 2400,
  /** Wie lange beide Karten offen in der Mitte liegen. */
  trickSettle: 1100,
  /** Dauer des Wegfliegens zum Gewinner. */
  trickFly: 520,
  /** Wie lange der Stapel des Gewinners hervorgehoben wird. */
  trickBump: 700,
  /** Puffer, bevor der Gewinner den Stich in der DB abraeumt. */
  advanceGrace: 350,
  /** Notbremse: uebernimmt der andere Client, falls der
   *  zustaendige gerade nicht reagiert. */
  advanceFallback: 2600,
} as const;

export const TRICK_ANIMATION_MS = TIMING.trickSettle + TIMING.trickFly;
