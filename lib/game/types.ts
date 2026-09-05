// Alle geteilten Typen des Spiels an einem Ort.
// Bewusst frei von React/Supabase, damit die Spiellogik
// unabhaengig von UI und Datenbank testbar bleibt.

export type Suit = "fire" | "water" | "air" | "earth";

export type Player = 1 | 2;

export type NormalCard = {
  id: string;
  type: "normal";
  suit: Suit;
  value: number;
};

export type WizardCard = {
  id: string;
  type: "wizard";
};

export type WitchCard = {
  id: string;
  type: "witch";
};

export type Card = NormalCard | WizardCard | WitchCard;

export type PlayedCard = {
  player: Player;
  card: Card;
};

export type ChatMessage = {
  id: string;
  player: Player;
  text: string;
  createdAt: number;
};

export type RoundResult = {
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

export type GamePhase =
  | "bidding"
  | "reveal"
  | "playing"
  | "trickResult"
  | "finished";

export type PlayerMap<T> = {
  player1: T;
  player2: T;
};

export type GameState = {
  version: number;
  roundIndex: number;
  roundNumber: number;
  handSize: number;
  startingPlayer: Player;
  currentPlayer: Player;

  hands: PlayerMap<Card[]>;

  trump: Suit;
  trumpCard: NormalCard;

  bids: PlayerMap<number | null>;
  tricksWon: PlayerMap<number>;

  trick: PlayedCard[];

  phase: GamePhase;

  // Bleiben aus Kompatibilitaetsgruenden im Zustand (die alte
  // Version liest sie noch). Die neue Oberflaeche steuert ihre
  // Animationen rein lokal, weil zwei Geraete keine synchrone
  // Uhr haben.
  revealUntil: number | null;
  trickResultUntil: number | null;

  lastTrickWinner: Player | null;
  roundComplete: boolean;

  scores: PlayerMap<number>;

  history: RoundResult[];
  chat: ChatMessage[];
};

export type WaitingState = {
  version: number;
  waiting: true;
};

export type StoredState = GameState | WaitingState;

export type GameStatus = "waiting" | "ready" | "playing" | "finished";

export type GameRow = {
  id: string;
  code: string;
  player1_name: string;
  player2_name: string | null;
  status: GameStatus;
  game_state: StoredState;
  created_at: string;
  updated_at: string;
};

export function otherPlayer(player: Player): Player {
  return player === 1 ? 2 : 1;
}

export function playerKey(player: Player): "player1" | "player2" {
  return player === 1 ? "player1" : "player2";
}
