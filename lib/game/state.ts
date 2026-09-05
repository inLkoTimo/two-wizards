import { ROUND_SIZES, STATE_VERSION, SUIT_INFO, TIMING } from "./constants";
import {
  calculatePoints,
  canPlayCard,
  createDeck,
  getLeadSuit,
  getTrickWinner,
  isNormalCard,
  shuffle,
  sortHand,
} from "./rules";
import {
  type Card,
  type ChatMessage,
  type GameState,
  type NormalCard,
  type PlayedCard,
  type Player,
  type PlayerMap,
  type RoundResult,
  type StoredState,
  type WaitingState,
  otherPlayer,
  playerKey,
} from "./types";

export function isGameState(
  value: StoredState | null | undefined,
): value is GameState {
  return Boolean(
    value && "roundIndex" in value && "hands" in value && "bids" in value,
  );
}

export function createWaitingState(): WaitingState {
  return { version: STATE_VERSION, waiting: true };
}

export function handOf(state: GameState, player: Player): Card[] {
  return state.hands[playerKey(player)];
}

export function bidOf(state: GameState, player: Player): number | null {
  return state.bids[playerKey(player)];
}

export function tricksOf(state: GameState, player: Player): number {
  return state.tricksWon[playerKey(player)];
}

export function scoreOf(state: GameState, player: Player): number {
  return state.scores[playerKey(player)];
}

function replace<T>(map: PlayerMap<T>, player: Player, value: T): PlayerMap<T> {
  return { ...map, [playerKey(player)]: value };
}

export function createRoundState(
  roundIndex: number,
  scores: PlayerMap<number>,
  history: RoundResult[],
  startingPlayer: Player,
  chat: ChatMessage[] = [],
): GameState {
  const handSize = ROUND_SIZES[roundIndex];
  const deck = shuffle(createDeck());

  const player1 = deck.slice(0, handSize);
  const player2 = deck.slice(handSize, handSize * 2);
  const remaining = deck.slice(handSize * 2);

  const trumpCard = remaining.find((card): card is NormalCard =>
    isNormalCard(card),
  );

  if (!trumpCard) {
    throw new Error("Trumpf konnte nicht bestimmt werden.");
  }

  return {
    version: STATE_VERSION,

    roundIndex,
    roundNumber: roundIndex + 1,
    handSize,

    startingPlayer,
    currentPlayer: startingPlayer,

    hands: {
      player1: sortHand(player1),
      player2: sortHand(player2),
    },

    trump: trumpCard.suit,
    trumpCard,

    bids: { player1: null, player2: null },
    tricksWon: { player1: 0, player2: 0 },

    trick: [],

    phase: "bidding",

    revealUntil: null,
    trickResultUntil: null,

    lastTrickWinner: null,
    roundComplete: false,

    scores,
    history,
    chat,
  };
}

/** Ansage eines Spielers eintragen. Sobald beide angesagt
 *  haben, werden die Ansagen aufgedeckt. */
export function applyBid(
  state: GameState,
  player: Player,
  bid: number,
): GameState | null {
  if (state.phase !== "bidding") {
    return null;
  }

  const safeBid = Math.max(0, Math.min(state.handSize, Math.floor(bid)));
  const bids = replace(state.bids, player, safeBid);
  const bothChosen = bids.player1 !== null && bids.player2 !== null;

  return {
    ...state,
    bids,
    phase: bothChosen ? "reveal" : "bidding",
    revealUntil: bothChosen ? Date.now() + TIMING.reveal : null,
  };
}

export type PlayCardResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: string };

/** Eine Karte spielen. Enthaelt die komplette Stich-Aufloesung
 *  inklusive Punktewertung am Rundenende - als reine Funktion,
 *  damit sie ohne Datenbank und ohne UI getestet werden kann. */
export function applyPlayedCard(
  state: GameState,
  player: Player,
  cardId: string,
): PlayCardResult {
  if (state.phase !== "playing") {
    return { ok: false, reason: "Gerade ist kein Zug moeglich." };
  }

  if (state.currentPlayer !== player) {
    return { ok: false, reason: "Du bist nicht am Zug." };
  }

  const hand = handOf(state, player);
  const card = hand.find((item) => item.id === cardId);

  if (!card) {
    return { ok: false, reason: "Diese Karte liegt nicht auf deiner Hand." };
  }

  if (!canPlayCard(card, hand, state.trick)) {
    const leadSuit = getLeadSuit(state.trick);

    return {
      ok: false,
      reason: leadSuit
        ? `Du musst ${SUIT_INFO[leadSuit].emoji} ${SUIT_INFO[leadSuit].name} bedienen.`
        : "Diese Karte kannst du gerade nicht spielen.",
    };
  }

  const hands = replace(
    state.hands,
    player,
    sortHand(hand.filter((item) => item.id !== card.id)),
  );

  const trick: PlayedCard[] = [...state.trick, { player, card }];

  // Erste Karte des Stichs: der andere Spieler ist dran.
  if (trick.length === 1) {
    return {
      ok: true,
      state: {
        ...state,
        hands,
        trick,
        currentPlayer: otherPlayer(player),
      },
    };
  }

  const winner = getTrickWinner(trick, state.trump);
  const tricksWon = replace(
    state.tricksWon,
    winner,
    state.tricksWon[playerKey(winner)] + 1,
  );

  const roundComplete =
    hands.player1.length + hands.player2.length === 0;

  let scores = state.scores;
  let history = state.history;

  if (roundComplete) {
    const bid1 = state.bids.player1 ?? 0;
    const bid2 = state.bids.player2 ?? 0;

    const points1 = calculatePoints(bid1, tricksWon.player1);
    const points2 = calculatePoints(bid2, tricksWon.player2);

    scores = {
      player1: scores.player1 + points1,
      player2: scores.player2 + points2,
    };

    history = [
      ...state.history,
      {
        round: state.roundNumber,
        cards: state.handSize,
        bid1,
        bid2,
        tricks1: tricksWon.player1,
        tricks2: tricksWon.player2,
        points1,
        points2,
        total1: scores.player1,
        total2: scores.player2,
      },
    ];
  }

  return {
    ok: true,
    state: {
      ...state,
      hands,
      trick,
      tricksWon,
      phase: "trickResult",
      trickResultUntil:
        Date.now() + TIMING.trickSettle + TIMING.trickFly,
      lastTrickWinner: winner,
      roundComplete,
      scores,
      history,
    },
  };
}

/** Aufgedeckte Ansagen wegblenden und mit dem Spiel weitermachen. */
export function finishReveal(state: GameState): GameState | null {
  if (state.phase !== "reveal") {
    return null;
  }

  return { ...state, phase: "playing", revealUntil: null };
}

/** Den abgeraeumten Stich vom Tisch nehmen. Der Gewinner spielt
 *  die naechste Karte an. */
export function finishTrick(state: GameState): GameState | null {
  if (state.phase !== "trickResult" || state.roundComplete) {
    return null;
  }

  return {
    ...state,
    phase: "playing",
    trick: [],
    trickResultUntil: null,
    currentPlayer: state.lastTrickWinner ?? state.currentPlayer,
  };
}

export function isLastRound(state: GameState): boolean {
  return state.roundIndex >= ROUND_SIZES.length - 1;
}

/** Naechste Runde austeilen - oder das Spiel beenden. */
export function startNextRound(state: GameState): GameState {
  if (isLastRound(state)) {
    return { ...state, phase: "finished" };
  }

  const nextIndex = state.roundIndex + 1;

  return createRoundState(
    nextIndex,
    state.scores,
    state.history,
    otherPlayer(state.startingPlayer),
    appendMessage(state.chat, {
      id: `chat-${Date.now()}`,
      player: 1,
      text: `Runde ${nextIndex + 1} beginnt! ✨`,
      createdAt: Date.now(),
    }),
  );
}

const MAX_CHAT_MESSAGES = 30;

export function appendMessage(
  chat: ChatMessage[],
  message: ChatMessage,
): ChatMessage[] {
  return [...chat, message].slice(-MAX_CHAT_MESSAGES);
}

export function appendChat(
  state: GameState,
  player: Player,
  text: string,
  kind: "chat" | "reaction" = "chat",
): GameState {
  return {
    ...state,
    chat: appendMessage(state.chat, {
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      player,
      text,
      createdAt: Date.now(),
    }),
  };
}

/** Eindeutiger Schluessel eines Stichs - Basis fuer die lokale
 *  Animation, damit derselbe Stich nicht doppelt animiert wird. */
export function trickKey(trick: PlayedCard[]): string {
  return trick.map((played) => played.card.id).join("|");
}
