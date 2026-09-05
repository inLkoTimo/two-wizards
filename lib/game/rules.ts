import { SUITS } from "./constants";
import type { Card, NormalCard, PlayedCard, Player, Suit } from "./types";

export function isNormalCard(card: Card): card is NormalCard {
  return card.type === "normal";
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (let value = 1; value <= 13; value++) {
      deck.push({
        id: randomId(`${suit}-${value}`),
        type: "normal",
        suit,
        value,
      });
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: randomId(`wizard-${i}`), type: "wizard" });
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: randomId(`witch-${i}`), type: "witch" });
  }

  return deck;
}

const SUIT_ORDER: Record<Suit, number> = {
  fire: 0,
  water: 1,
  air: 2,
  earth: 3,
};

export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    if (isNormalCard(a) && isNormalCard(b)) {
      if (a.suit !== b.suit) {
        return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
      }

      return a.value - b.value;
    }

    if (isNormalCard(a)) {
      return -1;
    }

    if (isNormalCard(b)) {
      return 1;
    }

    if (a.type === "wizard" && b.type === "witch") {
      return -1;
    }

    if (a.type === "witch" && b.type === "wizard") {
      return 1;
    }

    return 0;
  });
}

export function getLeadSuit(trick: PlayedCard[]): Suit | null {
  for (const item of trick) {
    if (isNormalCard(item.card)) {
      return item.card.suit;
    }
  }

  return null;
}

export function canPlayCard(
  card: Card,
  hand: Card[],
  trick: PlayedCard[],
): boolean {
  if (card.type === "wizard" || card.type === "witch") {
    return true;
  }

  const leadSuit = getLeadSuit(trick);

  if (!leadSuit) {
    return true;
  }

  const mustFollow = hand.some(
    (item) => isNormalCard(item) && item.suit === leadSuit,
  );

  if (!mustFollow) {
    return true;
  }

  return isNormalCard(card) && card.suit === leadSuit;
}

export function getTrickWinner(trick: PlayedCard[], trump: Suit): Player {
  const first = trick[0];
  const second = trick[1];

  if (first.card.type === "wizard") {
    return first.player;
  }

  if (second.card.type === "wizard") {
    return second.player;
  }

  if (first.card.type === "witch" && second.card.type === "witch") {
    return second.player;
  }

  if (first.card.type === "witch") {
    return second.player;
  }

  if (second.card.type === "witch") {
    return first.player;
  }

  if (!isNormalCard(first.card) || !isNormalCard(second.card)) {
    return first.player;
  }

  if (first.card.suit === second.card.suit) {
    return first.card.value >= second.card.value
      ? first.player
      : second.player;
  }

  if (first.card.suit === trump && second.card.suit !== trump) {
    return first.player;
  }

  if (second.card.suit === trump && first.card.suit !== trump) {
    return second.player;
  }

  return first.player;
}

export function calculatePoints(bid: number, tricks: number): number {
  if (bid === tricks) {
    return tricks * 10 + 10;
  }

  return Math.abs(tricks - bid) * -10;
}
