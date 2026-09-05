"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Suit = "fire" | "water" | "air" | "earth";
type Player = 1 | 2;

type NormalCard = {
  id: string;
  type: "normal";
  suit: Suit;
  value: number;
};

type WizardCard = {
  id: string;
  type: "wizard";
};

type WitchCard = {
  id: string;
  type: "witch";
};

type Card = NormalCard | WizardCard | WitchCard;

type PlayedCard = {
  player: Player;
  card: Card;
};

type ChatMessage = {
  id: string;
  player: 1 | 2;
  text: string;
  createdAt: number;
};

type RoundResult = {
  round: number;
  cards: number;
  bid1: number;
  bid2: number;
  tricks1: number;
  tricks2: number;
  points1: number;
  points2: number;
  total1: number;
  total2: number;
};

type GameState = {
  version: number;
  roundIndex: number;
  roundNumber: number;
  handSize: number;
  startingPlayer: Player;
  currentPlayer: Player;

  hands: {
    player1: Card[];
    player2: Card[];
  };

  trump: Suit;
  trumpCard: NormalCard;

  bids: {
    player1: number | null;
    player2: number | null;
  };

  tricksWon: {
    player1: number;
    player2: number;
  };

  trick: PlayedCard[];

  phase:
    | "bidding"
    | "reveal"
    | "playing"
    | "trickResult"
    | "finished";

  revealUntil: number | null;
  trickResultUntil: number | null;

  lastTrickWinner: Player | null;
  roundComplete: boolean;

  scores: {
    player1: number;
    player2: number;
  };

  history: RoundResult[];
  chat: ChatMessage[];
};

type WaitingState = {
  version: number;
  waiting: true;
};

type StoredState = GameState | WaitingState;

type GameRow = {
  id: string;
  code: string;
  player1_name: string;
  player2_name: string | null;
  status: "waiting" | "ready" | "playing" | "finished";
  game_state: StoredState;
  created_at: string;
  updated_at: string;
};

const supabase = createClient();

const ROUND_SIZES = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
];

const SUITS: Suit[] = [
  "fire",
  "water",
  "air",
  "earth",
];

const REACTIONS = [
  "❤️",
  "😂",
  "😭",
  "🙄",
  "😮",
  "😈",
  "👀",
  "👏",
  "🔥",
  "🫦",
  "🪨",
  "💦",
];

const SUIT_INFO: Record<
  Suit,
  {
    name: string;
    emoji: string;
    className: string;
  }
> = {
  fire: {
    name: "Feuer",
    emoji: "🔥",
    className:
      "from-red-950 via-red-700 to-orange-500",
  },

  water: {
    name: "Wasser",
    emoji: "💧",
    className:
      "from-blue-950 via-blue-700 to-cyan-400",
  },

  air: {
    name: "Luft",
    emoji: "🌪️",
    className:
      "from-slate-950 via-slate-500 to-white",
  },

  earth: {
    name: "Erde",
    emoji: "🪨",
    className:
      "from-stone-950 via-amber-900 to-yellow-700",
  },
};

function isNormalCard(
  card: Card,
): card is NormalCard {
  return card.type === "normal";
}

function isGameState(
  value: StoredState | null | undefined,
): value is GameState {
  return Boolean(
    value &&
      "roundIndex" in value &&
      "hands" in value &&
      "bids" in value,
  );
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1),
    );

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (
      let value = 1;
      value <= 13;
      value++
    ) {
      deck.push({
        id: `${suit}-${value}-${Math.random()
          .toString(36)
          .slice(2)}`,
        type: "normal",
        suit,
        value,
      });
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `wizard-${i}-${Math.random()
        .toString(36)
        .slice(2)}`,
      type: "wizard",
    });
  }

  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `witch-${i}-${Math.random()
        .toString(36)
        .slice(2)}`,
      type: "witch",
    });
  }

  return deck;
}

function sortHand(hand: Card[]): Card[] {
  const order: Record<Suit, number> = {
    fire: 0,
    water: 1,
    air: 2,
    earth: 3,
  };

  return [...hand].sort(
    (a, b) => {
      if (
        isNormalCard(a) &&
        isNormalCard(b)
      ) {
        if (a.suit !== b.suit) {
          return (
            order[a.suit] -
            order[b.suit]
          );
        }

        return a.value - b.value;
      }

      if (isNormalCard(a)) {
        return -1;
      }

      if (isNormalCard(b)) {
        return 1;
      }

      if (
        a.type === "wizard" &&
        b.type === "witch"
      ) {
        return -1;
      }

      if (
        a.type === "witch" &&
        b.type === "wizard"
      ) {
        return 1;
      }

      return 0;
    },
  );
}

function getLeadSuit(
  trick: PlayedCard[],
): Suit | null {
  for (const item of trick) {
    if (isNormalCard(item.card)) {
      return item.card.suit;
    }
  }

  return null;
}

function canPlayCard(
  card: Card,
  hand: Card[],
  trick: PlayedCard[],
): boolean {
  if (
    card.type === "wizard" ||
    card.type === "witch"
  ) {
    return true;
  }

  const leadSuit =
    getLeadSuit(trick);

  if (!leadSuit) {
    return true;
  }

  const mustFollow =
    hand.some(
      (item) =>
        isNormalCard(item) &&
        item.suit === leadSuit,
    );

  if (!mustFollow) {
    return true;
  }

  return (
    isNormalCard(card) &&
    card.suit === leadSuit
  );
}

function getTrickWinner(
  trick: PlayedCard[],
  trump: Suit,
): Player {
  const first = trick[0];
  const second = trick[1];

  if (
    first.card.type ===
    "wizard"
  ) {
    return first.player;
  }

  if (
    second.card.type ===
    "wizard"
  ) {
    return second.player;
  }

  if (
    first.card.type === "witch" &&
    second.card.type === "witch"
  ) {
    return second.player;
  }

  if (first.card.type === "witch") {
    return second.player;
  }

  if (second.card.type === "witch") {
    return first.player;
  }

  if (
    !isNormalCard(first.card) ||
    !isNormalCard(second.card)
  ) {
    return first.player;
  }

  if (
    first.card.suit ===
    second.card.suit
  ) {
    return first.card.value >=
      second.card.value
      ? first.player
      : second.player;
  }

  if (
    first.card.suit === trump &&
    second.card.suit !== trump
  ) {
    return first.player;
  }

  if (
    second.card.suit === trump &&
    first.card.suit !== trump
  ) {
    return second.player;
  }

  if (
    second.card.suit ===
    first.card.suit
  ) {
    return second.player;
  }

  return first.player;
}

function calculatePoints(
  bid: number,
  tricks: number,
): number {
  if (bid === tricks) {
    return tricks * 10 + 10;
  }

  return (
    Math.abs(tricks - bid) *
    -10
  );
}

function createRoundState(
  roundIndex: number,
  scores: {
    player1: number;
    player2: number;
  },
  history: RoundResult[],
  startingPlayer: Player,
): GameState {
  const handSize =
    ROUND_SIZES[roundIndex];

  const deck = shuffle(
    createDeck(),
  );

  const player1 =
    deck.slice(
      0,
      handSize,
    );

  const player2 =
    deck.slice(
      handSize,
      handSize * 2,
    );

  const remaining =
    deck.slice(
      handSize * 2,
    );

  const trumpCard =
    remaining.find(
      (
        card,
      ): card is NormalCard =>
        isNormalCard(card),
    );

  if (!trumpCard) {
    throw new Error(
      "Trumpf konnte nicht bestimmt werden.",
    );
  }

  return {
    version: 6,

    roundIndex,
    roundNumber:
      roundIndex + 1,
    handSize,

    startingPlayer,
    currentPlayer:
      startingPlayer,

    hands: {
      player1:
        sortHand(player1),
      player2:
        sortHand(player2),
    },

    trump:
      trumpCard.suit,

    trumpCard,

    bids: {
      player1: null,
      player2: null,
    },

    tricksWon: {
      player1: 0,
      player2: 0,
    },

    trick: [],

    phase: "bidding",

    revealUntil: null,
    trickResultUntil: null,

    lastTrickWinner: null,
    roundComplete: false,

    scores,

    history,

    chat: [],
  };
}

function CardBack() {
  return (
    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl border border-amber-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-black shadow-xl sm:h-24 sm:w-16">
      <div className="absolute inset-1 rounded-lg border border-amber-500/20" />

      <div className="flex h-full items-center justify-center text-2xl opacity-60">
        ✨
      </div>
    </div>
  );
}

function ElementCard({
  card,
  playable = false,
  onClick,
  compact = false,
}: {
  card: NormalCard;
  playable?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const info =
    SUIT_INFO[card.suit];

  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onClick}
      className={[
        "group relative shrink-0 overflow-hidden rounded-[1.25rem] border-2 border-white/30 bg-gradient-to-br text-white shadow-2xl transition duration-200",
        compact
          ? "h-28 w-20"
          : "h-40 w-28 sm:h-44 sm:w-32",
        info.className,

        playable
          ? "cursor-pointer hover:-translate-y-4 hover:scale-[1.04] hover:border-white"
          : "cursor-default",
      ].join(" ")}
    >
      <div className="absolute inset-1 rounded-[1rem] border border-white/20" />

      <div className="absolute -right-4 -top-5 text-7xl opacity-20">
        {info.emoji}
      </div>

      <div className="absolute -bottom-7 -left-5 text-8xl opacity-10">
        {info.emoji}
      </div>

      <div className="relative flex h-full flex-col items-center justify-center">
        <div
          className={
            compact
              ? "text-4xl font-black"
              : "text-6xl font-black sm:text-7xl"
          }
        >
          {card.value}
        </div>

        {!compact && (
          <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            {info.name}
          </div>
        )}
      </div>
    </button>
  );
}

function WizardCard({
  playable = false,
  onClick,
}: {
  card: WizardCard;
  playable?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onClick}
      className={[
        "group relative h-40 w-28 shrink-0 overflow-hidden rounded-[1.25rem] border-2 border-violet-300/60 bg-gradient-to-br from-slate-950 via-violet-900 to-indigo-950 text-white shadow-2xl transition sm:h-44 sm:w-32",

        playable
          ? "cursor-pointer hover:-translate-y-4 hover:scale-[1.04] hover:border-white"
          : "cursor-default",
      ].join(" ")}
    >
      <div className="absolute inset-1 rounded-[1rem] border border-violet-200/30" />

      <div className="relative flex h-full flex-col items-center justify-center">
        <div className="text-6xl">
          🧙
        </div>

        <div className="mt-3 text-lg font-black uppercase tracking-widest">
          Wizard
        </div>

        <div className="mt-1 text-[9px] text-violet-200/70">
          SCHLÄGT ALLES
        </div>
      </div>
    </button>
  );
}

function WitchCard({
  playable = false,
  onClick,
}: {
  card: WitchCard;
  playable?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onClick}
      className={[
        "group relative h-40 w-28 shrink-0 overflow-hidden rounded-[1.25rem] border-2 border-fuchsia-300/50 bg-gradient-to-br from-black via-fuchsia-950 to-slate-950 text-white shadow-2xl transition sm:h-44 sm:w-32",

        playable
          ? "cursor-pointer hover:-translate-y-4 hover:scale-[1.04] hover:border-white"
          : "cursor-default",
      ].join(" ")}
    >
      <div className="absolute inset-1 rounded-[1rem] border border-fuchsia-200/20" />

      <div className="relative flex h-full flex-col items-center justify-center">
        <div className="text-6xl">
          🧙‍♀️
        </div>

        <div className="mt-3 text-lg font-black uppercase tracking-widest">
          Hexe
        </div>

        <div className="mt-1 text-[9px] text-fuchsia-200/60">
          VERLIERT GEGEN ALLES
        </div>
      </div>
    </button>
  );
}

function CardView({
  card,
  playable = false,
  onClick,
  compact = false,
}: {
  card: Card;
  playable?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  if (card.type === "normal") {
    return (
      <ElementCard
        card={card}
        playable={playable}
        onClick={onClick}
        compact={compact}
      />
    );
  }

  if (card.type === "wizard") {
    return (
      <WizardCard
        card={card}
        playable={playable}
        onClick={onClick}
      />
    );
  }

  return (
    <WitchCard
      card={card}
      playable={playable}
      onClick={onClick}
    />
  );
}

export default function Home() {
  const [screen, setScreen] =
    useState<
      "home" | "create" | "join" | "lobby" | "game"
    >("home");

  const [name, setName] =
    useState("");

  const [joinCode, setJoinCode] =
    useState("");

  const [game, setGame] =
    useState<GameRow | null>(null);

  const [gameId, setGameId] =
    useState<string | null>(null);

  const [gameCode, setGameCode] =
    useState("");

  const [playerNumber, setPlayerNumber] =
    useState<Player | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [chatText, setChatText] =
    useState("");

  const [trickFlying, setTrickFlying] =
    useState(false);

  const [tricksBump, setTricksBump] =
    useState<Player | null>(null);

  const chatBottom =
    useRef<HTMLDivElement | null>(
      null,
    );

  const state =
    game &&
    isGameState(
      game.game_state,
    )
      ? game.game_state
      : null;

  const isCreator =
    playerNumber === 1;

  const myName =
    playerNumber === 1
      ? game?.player1_name ?? ""
      : game?.player2_name ?? "";

  const opponentName =
    playerNumber === 1
      ? game?.player2_name ?? ""
      : game?.player1_name ?? "";

  useEffect(() => {
    if (!gameId) {
      return;
    }

    const channel =
      supabase
        .channel(
          `two-wizards-${gameId}`,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            if (!payload.new) {
              return;
            }

            const updated =
              payload.new as GameRow;

            setGame(updated);

            if (
              updated.status ===
                "playing" ||
              updated.status ===
                "finished"
            ) {
              setScreen("game");
            }

            if (
              updated.status ===
                "waiting" ||
              updated.status ===
                "ready"
            ) {
              setScreen("lobby");
            }
          },
        )
        .subscribe();

    return () => {
      void supabase.removeChannel(
        channel,
      );
    };
  }, [gameId]);

  useEffect(() => {
    chatBottom.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [state?.chat?.length]);

  useEffect(() => {
    if (
      !state ||
      !gameId ||
      state.phase !==
        "reveal" ||
      !state.revealUntil
    ) {
      return;
    }

    const delay =
      Math.max(
        0,
        state.revealUntil -
          Date.now(),
      );

    const timer =
      setTimeout(
        async () => {
          const { data } =
            await supabase
              .from("games")
              .select("*")
              .eq("id", gameId)
              .single();

          if (!data) {
            return;
          }

          const latest =
            data as GameRow;

          if (
            !isGameState(
              latest.game_state,
            )
          ) {
            return;
          }

          if (
            latest.game_state.phase !==
            "reveal"
          ) {
            return;
          }

          await saveGameState(
            {
              ...latest.game_state,
              phase: "playing",
              revealUntil: null,
            },
            latest.id,
          );
        },
        delay + 100,
      );

    return () =>
      clearTimeout(timer);
  }, [
    state?.phase,
    state?.revealUntil,
    gameId,
  ]);

    useEffect(() => {
    if (
      !state ||
      !gameId ||
      !playerNumber ||
      state.phase !==
        "trickResult" ||
      !state.trickResultUntil ||
      state.roundComplete ||
      state.lastTrickWinner !==
        playerNumber
    ) {
      return;
    }

    const delay =
      Math.max(
        0,
        state.trickResultUntil -
          Date.now(),
      );

    const timer =
      setTimeout(
        async () => {
          const { data } =
            await supabase
              .from("games")
              .select("*")
              .eq("id", gameId)
              .single();

          if (!data) {
            return;
          }

          const latest =
            data as GameRow;

          if (
            !isGameState(
              latest.game_state,
            )
          ) {
            return;
          }

          if (
            latest.game_state.phase !==
              "trickResult" ||
            latest.game_state.roundComplete ||
            latest.game_state
                .lastTrickWinner !==
              playerNumber
          ) {
            return;
          }

          await saveGameState(
            {
              ...latest.game_state,
              phase: "playing",
              trick: [],
              trickResultUntil: null,
              currentPlayer:
                playerNumber,
            },
            latest.id,
          );
        },
        delay + 50,
      );

    return () =>
      clearTimeout(timer);
  }, [
    state?.phase,
    state?.trickResultUntil,
    state?.roundComplete,
    state?.lastTrickWinner,
    gameId,
    playerNumber,
  ]);

  // Steuert rein lokal (pro Client), wann die beiden
  // Trickkarten von "offen liegen" auf "wegfliegen zum
  // Gewinner" umschalten. Läuft unabhängig von der
  // geteilten DB-Phase, damit es ohne Round-Trip ruckelfrei
  // animiert.
  useEffect(() => {
    if (
      !state ||
      state.phase !== "trickResult" ||
      !state.trickResultUntil
    ) {
      setTrickFlying(false);
      return;
    }

    const flyDuration = 420;
    const until = state.trickResultUntil;
    const winner = state.lastTrickWinner;

    const delay = Math.max(
      0,
      until - flyDuration - Date.now(),
    );

    setTrickFlying(false);

    const flyTimer = setTimeout(() => {
      setTrickFlying(true);
    }, delay);

    const bumpTimer = setTimeout(() => {
      setTricksBump(winner);
    }, delay + flyDuration);

    const bumpClearTimer = setTimeout(() => {
      setTricksBump(null);
    }, delay + flyDuration + 550);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(bumpTimer);
      clearTimeout(bumpClearTimer);
    };
  }, [
    state?.phase,
    state?.trickResultUntil,
    state?.lastTrickWinner,
  ]);
  async function saveGameState(
    nextState: GameState,
    id: string | null = gameId,
  ) {
    if (!id) {
      return false;
    }

    const {
      data,
      error: updateError,
    } = await supabase
      .from("games")
      .update({
        game_state: nextState,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error(
        "SAVE GAME:",
        updateError,
      );

      setError(
        updateError.message,
      );

      return false;
    }

    if (data) {
      setGame(
        data as GameRow,
      );
    }

    return true;
  }

  async function createGame() {
    setError("");

    const playerName =
      name.trim();

    if (!playerName) {
      setError(
        "Bitte gib deinen Namen ein.",
      );
      return;
    }

    setLoading(true);

    try {
      const code =
        Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();

      const waitingState:
        WaitingState = {
        version: 6,
        waiting: true,
      };

      console.log(
        "CREATE GAME",
        {
          code,
          playerName,
          waitingState,
        },
      );

      const {
        data,
        error: insertError,
      } = await supabase
        .from("games")
        .insert({
          code,
          player1_name:
            playerName,
          player2_name: null,
          status: "waiting",
          game_state:
            waitingState,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error(
          "CREATE GAME ERROR:",
          insertError,
        );

        throw new Error(
          insertError.message,
        );
      }

      if (!data) {
        throw new Error(
          "Supabase hat kein Spiel zurückgegeben.",
        );
      }

      const created =
        data as GameRow;

      setGame(created);
      setGameId(created.id);
      setGameCode(created.code);
      setPlayerNumber(1);
      setScreen("lobby");
    } catch (err) {
      console.error(
        "CREATE GAME:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Spiel konnte nicht erstellt werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function joinGame() {
    setError("");

    const playerName =
      name.trim();

    const code =
      joinCode
        .trim()
        .toUpperCase();

    if (!playerName) {
      setError(
        "Bitte gib deinen Namen ein.",
      );
      return;
    }

    if (!code) {
      setError(
        "Bitte gib den Spielcode ein.",
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data,
        error: findError,
      } = await supabase
        .from("games")
        .select("*")
        .eq("code", code)
        .single();

      if (findError) {
        throw new Error(
          findError.message,
        );
      }

      if (!data) {
        throw new Error(
          "Spiel nicht gefunden.",
        );
      }

      const found =
        data as GameRow;

      if (found.player2_name) {
        throw new Error(
          "Dieses Spiel hat bereits zwei Spieler.",
        );
      }

      const {
        data: updated,
        error: updateError,
      } = await supabase
        .from("games")
        .update({
          player2_name:
            playerName,
          status: "ready",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", found.id)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(
          updateError.message,
        );
      }

      if (!updated) {
        throw new Error(
          "Spiel konnte nicht betreten werden.",
        );
      }

      const updatedGame =
        updated as GameRow;

      setGame(updatedGame);
      setGameId(updatedGame.id);
      setGameCode(
        updatedGame.code,
      );
      setPlayerNumber(2);
      setScreen("lobby");
    } catch (err) {
      console.error(
        "JOIN GAME:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Beitreten hat nicht funktioniert.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function startGame() {
    if (
      !game ||
      !game.player2_name
    ) {
      return;
    }

    if (!isCreator) {
      return;
    }

    setLoading(true);

    try {
      const firstRound =
        createRoundState(
          0,
          {
            player1: 0,
            player2: 0,
          },
          [],
          1,
        );

      firstRound.chat = [
        {
          id: `chat-${Date.now()}`,
          player: 1,
          text: "Viel Glück! 🪄",
          createdAt:
            Date.now(),
        },
      ];

      const {
        data,
        error: startError,
      } = await supabase
        .from("games")
        .update({
          status: "playing",
          game_state:
            firstRound,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", game.id)
        .select("*")
        .single();

      if (startError) {
        throw new Error(
          startError.message,
        );
      }

      if (data) {
        setGame(
          data as GameRow,
        );
      }

      setScreen("game");
    } catch (err) {
      console.error(
        "START GAME:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Spiel konnte nicht gestartet werden.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitBid(
    bid: number,
  ) {
    if (
      !gameId ||
      !playerNumber
    ) {
      return;
    }

    const { data } =
      await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

    if (!data) {
      return;
    }

    const latest =
      data as GameRow;

    if (
      !isGameState(
        latest.game_state,
      )
    ) {
      return;
    }

    const current =
      latest.game_state;

    if (
      current.phase !==
      "bidding"
    ) {
      return;
    }

    const safeBid =
      Math.max(
        0,
        Math.min(
          current.handSize,
          Math.floor(bid),
        ),
      );

    const bids = {
      player1:
        current.bids.player1,
      player2:
        current.bids.player2,
    };

    if (playerNumber === 1) {
      bids.player1 =
        safeBid;
    } else {
      bids.player2 =
        safeBid;
    }

    const bothChosen =
      bids.player1 !== null &&
      bids.player2 !== null;

    await saveGameState(
      {
        ...current,
        bids,
        phase: bothChosen
          ? "reveal"
          : "bidding",
        revealUntil:
          bothChosen
            ? Date.now() +
              2200
            : null,
      },
      latest.id,
    );
  }

  async function playCard(
    card: Card,
  ) {
    if (
      !gameId ||
      !playerNumber
    ) {
      return;
    }

    const { data } =
      await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

    if (!data) {
      return;
    }

    const latest =
      data as GameRow;

    if (
      !isGameState(
        latest.game_state,
      )
    ) {
      return;
    }

    const current =
      latest.game_state;

    if (
      current.phase !==
        "playing" ||
      current.currentPlayer !==
        playerNumber
    ) {
      return;
    }

    const hand =
      playerNumber === 1
        ? current.hands
            .player1
        : current.hands
            .player2;

    const selectedCard =
      hand.find(
        (item) =>
          item.id ===
          card.id,
      );

    if (!selectedCard) {
      return;
    }

    if (
      !canPlayCard(
        selectedCard,
        hand,
        current.trick,
      )
    ) {
      const leadSuit =
        getLeadSuit(
          current.trick,
        );

      if (leadSuit) {
        setError(
          `Du musst ${SUIT_INFO[leadSuit].emoji} ${SUIT_INFO[leadSuit].name} bedienen.`,
        );
      }

      setTimeout(
        () => setError(""),
        2500,
      );

      return;
    }

    const newHand =
      hand.filter(
        (item) =>
          item.id !==
          selectedCard.id,
      );

    const newHands = {
      player1:
        current.hands.player1,
      player2:
        current.hands.player2,
    };

    if (playerNumber === 1) {
      newHands.player1 =
        sortHand(
          newHand,
        );
    } else {
      newHands.player2 =
        sortHand(
          newHand,
        );
    }

    const newTrick: PlayedCard[] =
      [
        ...current.trick,
        {
          player:
            playerNumber,
          card:
            selectedCard,
        },
      ];

    if (
      newTrick.length ===
      1
    ) {
      await saveGameState(
        {
          ...current,
          hands: newHands,
          trick: newTrick,
          currentPlayer:
            playerNumber ===
            1
              ? 2
              : 1,
        },
        latest.id,
      );

      return;
    }

    const winner =
      getTrickWinner(
        newTrick,
        current.trump,
      );

    const tricksWon = {
      player1:
        current.tricksWon
          .player1,
      player2:
        current.tricksWon
          .player2,
    };

    if (winner === 1) {
      tricksWon.player1++;
    } else {
      tricksWon.player2++;
    }

    const remainingCards =
      newHands.player1
        .length +
      newHands.player2
        .length;

    const roundComplete =
      remainingCards === 0;

    let scores = {
      player1:
        current.scores
          .player1,
      player2:
        current.scores
          .player2,
    };

    let history = [
      ...current.history,
    ];

    if (roundComplete) {
      const bid1 =
        current.bids.player1 ??
        0;

      const bid2 =
        current.bids.player2 ??
        0;

      const points1 =
        calculatePoints(
          bid1,
          tricksWon.player1,
        );

      const points2 =
        calculatePoints(
          bid2,
          tricksWon.player2,
        );

      scores = {
        player1:
          scores.player1 +
          points1,

        player2:
          scores.player2 +
          points2,
      };

      history.push({
        round:
          current.roundNumber,

        cards:
          current.handSize,

        bid1,
        bid2,

        tricks1:
          tricksWon.player1,

        tricks2:
          tricksWon.player2,

        points1,
        points2,

        total1:
          scores.player1,

        total2:
          scores.player2,
      });
    }

    await saveGameState(
      {
        ...current,
        hands: newHands,
        trick: newTrick,
        tricksWon,

        phase:
          "trickResult",

        trickResultUntil:
          Date.now() +
          1200,

        lastTrickWinner:
          winner,

        roundComplete,

        scores,
        history,
      },
      latest.id,
    );
  }

  async function startNextRound() {
    if (
      !game ||
      !state ||
      !isCreator
    ) {
      return;
    }

    if (
      state.phase !==
        "trickResult" ||
      !state.roundComplete
    ) {
      return;
    }

    const nextIndex =
      state.roundIndex +
      1;

    if (
      nextIndex >=
      ROUND_SIZES.length
    ) {
      await saveGameState(
        {
          ...state,
          phase: "finished",
        },
        game.id,
      );

      await supabase
        .from("games")
        .update({
          status: "finished",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          game.id,
        );

      return;
    }

    const nextStarter: Player =
      state.startingPlayer ===
      1
        ? 2
        : 1;

    const nextState =
      createRoundState(
        nextIndex,
        state.scores,
        state.history,
        nextStarter,
      );

const roundMessage: ChatMessage = {
  id: `chat-${Date.now()}`,
  player: 1,
  text: `Runde ${nextIndex + 1} beginnt! ✨`,
  createdAt: Date.now(),
};

nextState.chat = [
  ...state.chat,
  roundMessage,
].slice(-30);

    await saveGameState(
      nextState,
      game.id,
    );
  }

  async function sendChat() {
    const text =
      chatText.trim();

    if (
      !text ||
      !gameId ||
      !playerNumber ||
      !state
    ) {
      return;
    }

    const message: ChatMessage =
      {
        id: `chat-${Date.now()}-${Math.random()}`,
        player:
          playerNumber,
        text,
        createdAt:
          Date.now(),
      };

    await saveGameState(
      {
        ...state,
        chat: [
          ...state.chat,
          message,
        ].slice(-30),
      },
      gameId,
    );

    setChatText("");
  }

  async function sendReaction(
    emoji: string,
  ) {
    if (
      !gameId ||
      !playerNumber ||
      !state
    ) {
      return;
    }

    const message: ChatMessage =
      {
        id: `reaction-${Date.now()}-${Math.random()}`,
        player:
          playerNumber,
        text: emoji,
        createdAt:
          Date.now(),
      };

    await saveGameState(
      {
        ...state,
        chat: [
          ...state.chat,
          message,
        ].slice(-30),
      },
      gameId,
    );
  }

  function resetToHome() {
    setScreen("home");
    setName("");
    setJoinCode("");
    setGame(null);
    setGameId(null);
    setGameCode("");
    setPlayerNumber(null);
    setError("");
    setChatText("");
  }

  function ChatPanel() {
    if (!state) {
      return null;
    }

    return (
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#090d12]">
        <div className="border-b border-white/10 px-4 py-3 text-center font-black">
          💬 CHAT
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {state.chat.map(
            (message) => {
              const own =
                message.player ===
                playerNumber;

              return (
                <div
                  key={message.id}
                  className={
                    own
                      ? "text-right"
                      : "text-left"
                  }
                >
                  <div className="mb-1 text-[10px] text-slate-600">
                    {message.player ===
                    1
                      ? game?.player1_name
                      : game?.player2_name}
                  </div>

                  <div
                    className={[
                      "inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                      own
                        ? "bg-purple-600/30 text-purple-100"
                        : "bg-white/5 text-slate-300",
                    ].join(" ")}
                  >
                    {message.text}
                  </div>
                </div>
              );
            },
          )}

          <div ref={chatBottom} />
        </div>

        <div className="border-t border-white/10 p-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendChat();
            }}
            className="flex gap-2"
          >
            <input
              value={chatText}
              onChange={(event) =>
                setChatText(
                  event.target.value,
                )
              }
              placeholder="Nachricht..."
              maxLength={120}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-600"
            />

            <button
              type="submit"
              className="rounded-xl bg-purple-600 px-3 text-lg"
            >
              ➤
            </button>
          </form>

          <div className="mt-2 flex flex-wrap gap-1">
            {REACTIONS.map(
              (emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() =>
                    void sendReaction(
                      emoji,
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm hover:bg-white/10"
                >
                  {emoji}
                </button>
              ),
            )}
          </div>
        </div>
      </aside>
    );
  }

  function ScorePanel() {
    if (!state) {
      return null;
    }

    return (
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#090d12]">
        <div className="border-b border-white/10 px-4 py-4 text-center font-black text-amber-200">
          PUNKTÜBERSICHT
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {state.history.map(
            (row) => (
              <div
                key={row.round}
                className="border-b border-white/5 px-3 py-3 text-xs"
              >
                <div className="font-bold text-purple-200">
                  Runde{" "}
                  {row.round}
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[9px] text-slate-600">
                      {game?.player1_name}
                    </div>

                    <div>
                      {row.bid1} →
                      {" "}
                      {row.tricks1}
                    </div>

                    <div
                      className={
                        row.points1 >=
                        0
                          ? "text-emerald-300"
                          : "text-red-300"
                      }
                    >
                      {row.points1 >
                      0
                        ? "+"
                        : ""}
                      {row.points1}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-600">
                      {game?.player2_name}
                    </div>

                    <div>
                      {row.bid2} →
                      {" "}
                      {row.tricks2}
                    </div>

                    <div
                      className={
                        row.points2 >=
                        0
                          ? "text-emerald-300"
                          : "text-red-300"
                      }
                    >
                      {row.points2 >
                      0
                        ? "+"
                        : ""}
                      {row.points2}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-600">
                      Gesamt
                    </div>

                    <div>
                      {row.total1}
                    </div>

                    <div>
                      {row.total2}
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-purple-500/10 p-3">
              <div className="truncate text-[10px] text-purple-300">
                {game?.player1_name}
              </div>

              <div className="text-2xl font-black">
                {state.scores.player1}
              </div>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-3">
              <div className="truncate text-[10px] text-blue-300">
                {game?.player2_name}
              </div>

              <div className="text-2xl font-black">
                {state.scores.player2}
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  if (screen === "home") {
    return (
      <main className="min-h-screen bg-[#05080d] text-white">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl">
            🧙‍♂️ ✨ 🧙‍♀️
          </div>

          <div className="mt-6 text-sm font-bold uppercase tracking-[0.35em] text-purple-300">
            A magical game for two
          </div>

          <h1 className="mt-3 text-6xl font-black sm:text-8xl">
            Two Wizards
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
            Ein gemeinsamer
            Kartentisch.
            <br />
            Egal, wie viele
            Kilometer dazwischen
            liegen.
          </p>

          <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setError("");
                setScreen("create");
              }}
              className="flex-1 rounded-2xl bg-white px-6 py-4 font-black text-slate-950"
            >
              Spiel erstellen
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setScreen("join");
              }}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-black"
            >
              Spiel beitreten
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "create") {
    return (
      <main className="min-h-screen bg-[#05080d] text-white">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
          <button
            type="button"
            onClick={() =>
              setScreen("home")
            }
            className="mb-8 self-start text-sm text-slate-500"
          >
            ← Zurück
          </button>

          <div className="text-5xl">
            🧙‍♂️
          </div>

          <h1 className="mt-5 text-4xl font-black">
            Spiel erstellen
          </h1>

          <p className="mt-3 text-slate-400">
            Gib deinen Namen ein.
          </p>

          <input
            value={name}
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
            placeholder="Dein Name"
            maxLength={24}
            className="mt-7 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-lg outline-none"
          />

          {error && (
            <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void createGame()
            }
            className="mt-5 rounded-2xl bg-white px-6 py-4 font-black text-slate-950 disabled:opacity-50"
          >
            {loading
              ? "Wird erstellt..."
              : "Spiel erstellen ✨"}
          </button>
        </div>
      </main>
    );
  }

  if (screen === "join") {
    return (
      <main className="min-h-screen bg-[#05080d] text-white">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
          <button
            type="button"
            onClick={() =>
              setScreen("home")
            }
            className="mb-8 self-start text-sm text-slate-500"
          >
            ← Zurück
          </button>

          <div className="text-5xl">
            🧙‍♀️
          </div>

          <h1 className="mt-5 text-4xl font-black">
            Spiel beitreten
          </h1>

          <p className="mt-3 text-slate-400">
            Name und Spielcode
            eingeben.
          </p>

          <input
            value={name}
            onChange={(event) =>
              setName(
                event.target.value,
              )
            }
            placeholder="Dein Name"
            maxLength={24}
            className="mt-7 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-lg outline-none"
          />

          <input
            value={joinCode}
            onChange={(event) =>
              setJoinCode(
                event.target.value.toUpperCase(),
              )
            }
            placeholder="ABC123"
            maxLength={6}
            className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-lg font-black tracking-[0.3em] outline-none"
          />

          {error && (
            <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void joinGame()
            }
            className="mt-5 rounded-2xl bg-amber-500/20 px-6 py-4 font-black text-amber-100 ring-1 ring-amber-400/40 disabled:opacity-50"
          >
            {loading
              ? "Beitritt..."
              : "Spiel beitreten 🪄"}
          </button>
        </div>
      </main>
    );
  }

  if (screen === "lobby") {
    const ready =
      Boolean(game?.player2_name);

    return (
      <main className="min-h-screen bg-[#05080d] text-white">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 sm:p-10">
            <div className="text-center">
              <div className="text-5xl">
                🧙‍♂️ ✨ 🧙‍♀️
              </div>

              <h1 className="mt-5 text-4xl font-black">
                Dein Kartentisch
              </h1>

              <p className="mt-3 text-slate-400">
                {ready
                  ? "Beide Wizards sind bereit."
                  : "Warte auf den zweiten Wizard..."}
              </p>
            </div>

            <div className="mt-8 rounded-3xl bg-black/30 p-6 text-center">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                Spielcode
              </div>

              <div className="mt-3 text-5xl font-black tracking-[0.25em] text-purple-200">
                {gameCode}
              </div>

              <div className="mt-3 text-xs text-slate-600">
                Teile diesen Code
                mit deinem zweiten
                Wizard.
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-purple-500/10 p-5">
                <div className="text-xs text-purple-300">
                  Wizard 1
                </div>

                <div className="mt-2 text-xl font-bold">
                  {game?.player1_name}
                </div>
              </div>

              <div className="rounded-2xl bg-blue-500/10 p-5">
                <div className="text-xs text-blue-300">
                  Wizard 2
                </div>

                <div className="mt-2 text-xl font-bold">
                  {game?.player2_name ??
                    "Warte..."}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {isCreator && (
              <button
                type="button"
                disabled={
                  !ready ||
                  loading
                }
                onClick={() =>
                  void startGame()
                }
                className="mt-6 w-full rounded-2xl bg-white px-6 py-4 font-black text-slate-950 disabled:opacity-40"
              >
                {ready
                  ? "Kartentisch öffnen 🃏"
                  : "Warte auf Spieler 2..."}
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!state || !game) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05080d] text-white">
        <div className="text-center">
          <div className="text-5xl">
            🪄
          </div>

          <div className="mt-4 text-xl font-black">
            Spiel wird geladen...
          </div>
        </div>
      </main>
    );
  }

  if (
    state.phase ===
    "finished"
  ) {
    const draw =
      state.scores.player1 ===
      state.scores.player2;

    const winner =
      state.scores.player1 >
      state.scores.player2
        ? game.player1_name
        : game.player2_name;

    return (
      <main className="min-h-screen bg-[#05080d] text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-2xl rounded-[2rem] border border-amber-300/20 bg-white/[0.04] p-8 text-center">
            <div className="text-7xl">
              {draw
                ? "🤝"
                : "🏆"}
            </div>

            <div className="mt-6 text-sm font-black uppercase tracking-[0.35em] text-amber-200">
              Spiel beendet
            </div>

            <h1 className="mt-3 text-5xl font-black">
              {draw
                ? "Unentschieden!"
                : `${winner} gewinnt!`}
            </h1>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-purple-500/10 p-6">
                <div className="text-purple-300">
                  {game.player1_name}
                </div>

                <div className="mt-2 text-5xl font-black">
                  {
                    state.scores
                      .player1
                  }
                </div>
              </div>

              <div className="rounded-3xl bg-blue-500/10 p-6">
                <div className="text-blue-300">
                  {game.player2_name}
                </div>

                <div className="mt-2 text-5xl font-black">
                  {
                    state.scores
                      .player2
                  }
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={
                resetToHome
              }
              className="mt-8 w-full rounded-2xl bg-white px-6 py-4 font-black text-slate-950"
            >
              Noch einmal
              spielen ✨
            </button>
          </div>
        </div>
      </main>
    );
  }

  const myHand =
    playerNumber === 1
      ? state.hands.player1
      : state.hands.player2;

  const opponentHand =
    playerNumber === 1
      ? state.hands.player2
      : state.hands.player1;

  const myTricks =
    playerNumber === 1
      ? state.tricksWon.player1
      : state.tricksWon.player2;

  const opponentTricks =
    playerNumber === 1
      ? state.tricksWon.player2
      : state.tricksWon.player1;

  const myBid =
    playerNumber === 1
      ? state.bids.player1
      : state.bids.player2;

  const myTurn =
    state.currentPlayer ===
    playerNumber;

  const leadSuit =
    getLeadSuit(state.trick);

  return (
    <main className="h-screen overflow-hidden bg-[#04070b] text-white">
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#060a10] px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              🧙
            </div>

            <div className="hidden font-serif text-2xl font-black text-amber-200 sm:block">
              TWO WIZARDS
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
              Raum:{" "}
              <span className="font-bold text-white">
                {gameCode}
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
              👥 2 / 2
            </div>
          </div>

          <button
            type="button"
            onClick={resetToHome}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400"
          >
            Spiel verlassen
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_290px] gap-3 p-3">
          <ChatPanel />

          <section className="relative min-h-0 overflow-hidden rounded-[2rem] border-4 border-[#34251a] bg-[radial-gradient(circle_at_center,#235f42,#123b2b_52%,#081b13)] shadow-2xl">
            <div className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-amber-500/10" />

            {/* TRUMPF LINKS OBEN */}
            <div className="absolute left-3 top-3 z-20 sm:left-6 sm:top-5">
              <div className="flex flex-col items-center">
                <div className="mb-2 rounded-full border border-amber-300/40 bg-[#090d12]/90 px-4 py-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-200">
                    ✨ TRUMPF ✨
                  </span>
                </div>

                <div className="rounded-[1.5rem] border border-amber-300/50 bg-black/35 p-1.5">
                  <CardView
                    card={
                      state.trumpCard
                    }
                    compact
                  />
                </div>

                <div className="mt-2 rounded-full border border-amber-300/20 bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-amber-100">
                  {
                    SUIT_INFO[
                      state.trump
                    ].emoji
                  }{" "}
                  {
                    SUIT_INFO[
                      state.trump
                    ].name
                  }
                </div>
              </div>
            </div>

            <div className="relative flex h-full min-h-0 flex-col px-4 py-3 sm:px-7">
              <div className="flex shrink-0 items-center justify-between">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2">
                  <div className="text-[10px] uppercase text-emerald-100/40">
                    Gegner
                  </div>

                  <div className="font-bold">
                    {opponentName ||
                      "Spieler 2"}
                  </div>

                  <div
                    className={[
                      "text-xs text-emerald-100/60 transition-transform duration-300",
                      tricksBump ===
                      (playerNumber === 1
                        ? 2
                        : 1)
                        ? "scale-125 text-amber-300"
                        : "scale-100",
                    ].join(" ")}
                  >
                    {opponentTricks}{" "}
                    Stiche
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-black/30 px-6 py-3 text-center">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50">
                    Runde
                  </div>

                  <div className="text-2xl font-black">
                    {
                      state.roundNumber
                    }
                    <span className="text-sm text-slate-600">
                      {" "}
                      / 19
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex shrink-0 justify-center">
                <div className="flex -space-x-3">
                  {opponentHand.map(
                    (card) => (
                      <CardBack
                        key={card.id}
                      />
                    ),
                  )}
                </div>
              </div>

              <div className="relative flex min-h-0 flex-1 items-center justify-center">
                <div className="absolute top-2 left-1/2 z-30 -translate-x-1/2 rounded-2xl border border-amber-300/20 bg-black/70 px-5 py-2 text-center shadow-xl">
  <div className="text-[9px] uppercase tracking-[0.25em] text-amber-200/50">
    Am Zug
  </div>

  <div className="font-black text-amber-100">
    {state.currentPlayer === playerNumber
      ? "✨ Du bist dran"
      : `🪄 ${opponentName} ist dran`}
  </div>
</div>
                {state.phase ===
                  "bidding" && (
                  <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-black/40 p-6 text-center">
                    <div className="text-5xl">
                      🔮
                    </div>

                    <div className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-purple-300/70">
                      Geheimnisvolle
                      Ansage
                    </div>

                    <h2 className="mt-2 text-3xl font-black">
                      Wie viele Stiche schaffst du?
                    </h2>
                    <div className="mt-4 rounded-2xl bg-amber-500/10 px-4 py-3">
  <div className="text-[9px] uppercase tracking-[0.25em] text-amber-200/50">
    Als Nächstes dran
  </div>

  <div className="mt-1 font-black text-amber-100">
    {state.currentPlayer === playerNumber
      ? "✨ Du bist dran"
      : `🪄 ${opponentName} ist dran`}
  </div>
</div>

                    <div className="mt-3 text-sm text-slate-500">
                      {myBid !==
                      null
                        ? `Du hast ${myBid} gewählt.`
                        : "Wähle deine Ansage."}
                    </div>

                    <div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-11">
                      {Array.from(
                        {
                          length:
                            state.handSize +
                            1,
                        },
                        (
                          _,
                          value,
                        ) => (
                          <button
                            key={
                              value
                            }
                            type="button"
                            onClick={() =>
                              void submitBid(
                                value,
                              )
                            }
                            className={[
                              "rounded-xl border px-2 py-3 text-lg font-black",
                              myBid ===
                              value
                                ? "border-purple-300 bg-purple-500/30"
                                : "border-white/10 bg-white/5",
                            ].join(
                              " ",
                            )}
                          >
                            {
                              value
                            }
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {state.phase ===
                  "reveal" && (
                  <div className="rounded-[2rem] border border-purple-300/20 bg-black/60 px-10 py-8 text-center">
                    <div className="text-5xl">
                      ✨
                    </div>

                    <h2 className="mt-3 text-3xl font-black">
                      Ansagen enthüllt
                    </h2>

                    <div className="mt-5 flex gap-3">
                      <div className="rounded-2xl bg-purple-500/10 px-6 py-4">
                        <div className="text-[10px] text-purple-300">
                          {
                            game.player1_name
                          }
                        </div>

                        <div className="text-3xl font-black">
                          {
                            state.bids
                              .player1
                          }
                        </div>
                      </div>

                      <div className="rounded-2xl bg-blue-500/10 px-6 py-4">
                        <div className="text-[10px] text-blue-300">
                          {
                            game.player2_name
                          }
                        </div>

                        <div className="text-3xl font-black">
                          {
                            state.bids
                              .player2
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {state.phase ===
                  "playing" && (
                  <div className="w-full">
                    <div className="mb-5 text-center">
                      <div
                        className={
                          myTurn
                            ? "font-black text-emerald-200"
                            : "text-emerald-100/50"
                        }
                      >
                        {myTurn
                          ? "✨ Du bist dran"
                          : `${opponentName} ist dran`}
                      </div>

                      {leadSuit && (
                        <div className="mt-1 text-[11px] text-emerald-100/40">
                          Angespielt:{" "}
                          {
                            SUIT_INFO[
                              leadSuit
                            ].emoji
                          }{" "}
                          {
                            SUIT_INFO[
                              leadSuit
                            ].name
                          }
                        </div>
                      )}
                    </div>

                    <div className="flex min-h-[190px] items-center justify-center gap-4">
                      {state.trick.map(
                        (played) => (
                          <div
                            key={
                              played
                                .card
                                .id
                            }
                            className="text-center"
                          >
                            <div className="mb-2 text-[9px] text-emerald-100/40">
                              {played.player ===
                              playerNumber
                                ? "Du"
                                : opponentName}
                            </div>

                            <CardView
                              card={
                                played.card
                              }
                            />
                          </div>
                        ),
                      )}

                      {state.trick
                        .length ===
                        0 && (
                        <div className="flex h-36 w-28 items-center justify-center rounded-2xl border border-dashed border-amber-500/20 text-4xl opacity-30">
                          🃏
                        </div>
                      )}
                    </div>
                  </div>
                )}

{state.phase ===
  "trickResult" && (
  <div className="w-full">
    {/* BEIDE KARTEN LIEGEN KURZ OFFEN, DANN FLIEGEN SIE ZUM GEWINNER */}
    <div className="flex min-h-[230px] items-center justify-center">
      <div
        className="flex items-center justify-center"
        style={
          trickFlying
            ? {
                transform:
                  state.lastTrickWinner ===
                  playerNumber
                    ? "translate(0px, 240px) scale(0.4)"
                    : "translate(-170px, -240px) scale(0.4)",
                opacity: 0,
                transition:
                  "transform 420ms cubic-bezier(0.4,0,1,1), opacity 420ms ease-in",
              }
            : {
                transform:
                  "translate(0px, 0px) scale(1)",
                opacity: 1,
                transition:
                  "transform 200ms ease-out, opacity 200ms ease-out",
              }
        }
      >
        {state.trick.map(
          (played, index) => (
            <div
              key={played.card.id}
              className={[
                "relative text-center",
                index === 1
                  ? "-ml-12 sm:-ml-16"
                  : "",
              ].join(" ")}
              style={{
                zIndex: index + 1,
                transform:
                  index === 0
                    ? "rotate(-5deg)"
                    : "rotate(5deg)",
              }}
            >
              <div className="mb-2 text-[9px] font-bold text-emerald-100/50">
                {played.player ===
                playerNumber
                  ? "Du"
                  : opponentName}
              </div>

              <CardView
                card={played.card}
              />
            </div>
          ),
        )}
      </div>
    </div>

    {/* ERST WENN DIE RUNDE ZU ENDE IST, KOMMT EIN KASTEN MIT AKTION */}
    {state.roundComplete && (
      <div className="mx-auto w-fit rounded-[2rem] border border-amber-300/20 bg-black/60 px-8 py-5 text-center">
        <div className="text-3xl">
          🏆
        </div>

        {isCreator && (
          <button
            type="button"
            onClick={() =>
              void startNextRound()
            }
            className="mt-5 rounded-2xl bg-white px-6 py-4 font-black text-slate-950"
          >
            {state.roundIndex ===
            ROUND_SIZES.length - 1
              ? "Spiel beenden 🏆"
              : "Neue Runde – Ansagen ✨"}
          </button>
        )}

        {!isCreator && (
          <div className="mt-5 text-xs uppercase tracking-[0.2em] text-slate-600">
            Warte auf den anderen Wizard...
          </div>
        )}
      </div>
    )}
  </div>
)}
              {state.phase !==
                "bidding" && (
                <div className="mb-2 flex shrink-0 items-center justify-center gap-2 text-[9px]">
                  <span className="uppercase tracking-[0.18em] text-amber-200/40">
                    Ansagen
                  </span>

                  <span className="font-bold">
                    {
                      game.player1_name
                    }
                    :{" "}
                    {
                      state.bids
                        .player1
                    }
                  </span>

                  <span className="text-slate-700">
                    •
                  </span>

                  <span className="font-bold">
                    {
                      game.player2_name
                    }
                    :{" "}
                    {
                      state.bids
                        .player2
                    }
                  </span>
                </div>
              )}

              <div className="text-center text-xs text-emerald-100/50">
                Deine Stiche:{" "}
                <span
                  className={[
                    "inline-block font-bold text-white transition-transform duration-300",
                    tricksBump ===
                    playerNumber
                      ? "scale-125 text-amber-300"
                      : "scale-100",
                  ].join(" ")}
                >
                  {myTricks}
                </span>
              </div>

              <div className="mt-3 flex shrink-0 justify-center overflow-x-auto pb-1 pt-2">
                <div className="flex items-end gap-2 px-3">
                  {myHand.map(
                    (card) => {
                      const playable =
                        state.phase ===
                          "playing" &&
                        myTurn &&
                        canPlayCard(
                          card,
                          myHand,
                          state.trick,
                        );

                      return (
                        <CardView
                          key={
                            card.id
                          }
                          card={
                            card
                          }
                          playable={
                            playable
                          }
                          onClick={() => {
                            if (
                              playable
                            ) {
                              void playCard(
                                card,
                              );
                            }
                          }}
                        />
                      );
                    },
                  )}
                </div>
              </div>

              {error && (
                <div className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-2xl border border-red-400/20 bg-red-950/90 px-5 py-3 text-center text-sm text-red-200 shadow-2xl">
                  {error}
                </div>
              )}
            </div>
          </section>

          <ScorePanel />
        </div>
      </div>
    </main>
  );
}