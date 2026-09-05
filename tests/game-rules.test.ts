import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calculatePoints,
  canPlayCard,
  createDeck,
  getLeadSuit,
  getTrickWinner,
} from "../lib/game/rules";
import {
  applyBid,
  applyPlayedCard,
  createRoundState,
  finishTrick,
  handOf,
  startNextRound,
} from "../lib/game/state";
import type {
  Card,
  GameState,
  NormalCard,
  PlayedCard,
  Player,
  Suit,
} from "../lib/game/types";

// --- kleine Helfer ----------------------------------------------------

function card(suit: Suit, value: number): NormalCard {
  return { id: `${suit}-${value}`, type: "normal", suit, value };
}

const wizard: Card = { id: "wizard-test", type: "wizard" };
const witch: Card = { id: "witch-test", type: "witch" };

function played(player: Player, item: Card): PlayedCard {
  return { player, card: item };
}

/** Zustand mit fest gesetzten Haenden - so laesst sich jede
 *  Situation gezielt nachstellen. */
function situation(
  hand1: Card[],
  hand2: Card[],
  overrides: Partial<GameState> = {},
): GameState {
  const base = createRoundState(0, { player1: 0, player2: 0 }, [], 1);

  return {
    ...base,
    hands: { player1: hand1, player2: hand2 },
    bids: { player1: 1, player2: 0 },
    phase: "playing",
    trump: "earth",
    ...overrides,
  };
}

// --- Deck --------------------------------------------------------------

test("Deck hat 60 Karten und keine doppelten IDs", () => {
  const deck = createDeck();

  assert.equal(deck.length, 60);
  assert.equal(deck.filter((item) => item.type === "wizard").length, 4);
  assert.equal(deck.filter((item) => item.type === "witch").length, 4);
  assert.equal(new Set(deck.map((item) => item.id)).size, 60);
});

test("ausgeteilte Haende teilen keine Karte doppelt", () => {
  const state = createRoundState(9, { player1: 0, player2: 0 }, [], 1);
  const ids = [
    ...state.hands.player1.map((item) => item.id),
    ...state.hands.player2.map((item) => item.id),
    state.trumpCard.id,
  ];

  assert.equal(state.handSize, 10);
  assert.equal(new Set(ids).size, ids.length);
});

// --- Bedienpflicht -----------------------------------------------------

test("Farbe muss bedient werden, wenn man sie hat", () => {
  const hand = [card("fire", 3), card("water", 9)];
  const trick = [played(1, card("fire", 7))];

  assert.equal(canPlayCard(card("water", 9), hand, trick), false);
  assert.equal(canPlayCard(card("fire", 3), hand, trick), true);
});

test("ohne die angespielte Farbe ist alles erlaubt", () => {
  const hand = [card("water", 9), card("earth", 2)];
  const trick = [played(1, card("fire", 7))];

  assert.equal(canPlayCard(card("water", 9), hand, trick), true);
});

test("Wizard und Hexe darf man immer legen", () => {
  const hand = [card("fire", 3), wizard, witch];
  const trick = [played(1, card("fire", 7))];

  assert.equal(canPlayCard(wizard, hand, trick), true);
  assert.equal(canPlayCard(witch, hand, trick), true);
});

test("die Hexe legt keine Farbe fest", () => {
  assert.equal(getLeadSuit([played(1, witch)]), null);
  assert.equal(getLeadSuit([played(1, witch), played(2, card("air", 4))]), "air");
});

// --- Stichauswertung ---------------------------------------------------

test("der erste Wizard gewinnt den Stich", () => {
  assert.equal(getTrickWinner([played(1, wizard), played(2, wizard)], "earth"), 1);
  assert.equal(
    getTrickWinner([played(1, card("earth", 13)), played(2, wizard)], "earth"),
    2,
  );
});

test("die Hexe verliert gegen jede Karte", () => {
  assert.equal(
    getTrickWinner([played(1, witch), played(2, card("fire", 1))], "earth"),
    2,
  );
  assert.equal(
    getTrickWinner([played(1, card("fire", 1)), played(2, witch)], "earth"),
    1,
  );
});

test("Trumpf schlaegt eine hoehere Karte anderer Farbe", () => {
  assert.equal(
    getTrickWinner(
      [played(1, card("fire", 13)), played(2, card("earth", 2))],
      "earth",
    ),
    2,
  );
});

test("gleiche Farbe: die hoehere Karte gewinnt", () => {
  assert.equal(
    getTrickWinner(
      [played(1, card("water", 4)), played(2, card("water", 11))],
      "earth",
    ),
    2,
  );
  assert.equal(
    getTrickWinner(
      [played(1, card("water", 11)), played(2, card("water", 4))],
      "earth",
    ),
    1,
  );
});

test("angespielte Farbe schlaegt eine fremde Farbe ohne Trumpf", () => {
  assert.equal(
    getTrickWinner(
      [played(1, card("water", 2)), played(2, card("fire", 13))],
      "earth",
    ),
    1,
  );
});

// --- Punkte ------------------------------------------------------------

test("Punkte: getroffene Ansage zahlt, verfehlte kostet", () => {
  assert.equal(calculatePoints(0, 0), 10);
  assert.equal(calculatePoints(3, 3), 40);
  assert.equal(calculatePoints(2, 4), -20);
  assert.equal(calculatePoints(3, 0), -30);
});

// --- Spielablauf -------------------------------------------------------

test("Ansagen: erst wenn beide gewaehlt haben, wird aufgedeckt", () => {
  const start = createRoundState(2, { player1: 0, player2: 0 }, [], 1);

  const afterFirst = applyBid(start, 1, 2);
  assert.ok(afterFirst);
  assert.equal(afterFirst.phase, "bidding");

  const afterSecond = applyBid(afterFirst, 2, 1);
  assert.ok(afterSecond);
  assert.equal(afterSecond.phase, "reveal");
  assert.deepEqual(afterSecond.bids, { player1: 2, player2: 1 });
});

test("Ansage wird auf die Handgroesse begrenzt", () => {
  const start = createRoundState(0, { player1: 0, player2: 0 }, [], 1);
  const result = applyBid(start, 1, 99);

  assert.equal(result?.bids.player1, 1);
});

test("die erste Karte gibt ab, die zweite loest den Stich aus", () => {
  const state = situation(
    [card("fire", 5), card("water", 2)],
    [card("fire", 9), card("earth", 3)],
    { handSize: 2, currentPlayer: 1 },
  );

  const first = applyPlayedCard(state, 1, "fire-5");
  assert.ok(first.ok);
  assert.equal(first.state.phase, "playing");
  assert.equal(first.state.currentPlayer, 2);
  assert.equal(first.state.trick.length, 1);

  const second = applyPlayedCard(first.state, 2, "fire-9");
  assert.ok(second.ok);
  assert.equal(second.state.phase, "trickResult");
  assert.equal(second.state.trick.length, 2);
  assert.equal(second.state.lastTrickWinner, 2);
  assert.equal(second.state.tricksWon.player2, 1);
  assert.equal(second.state.roundComplete, false);
});

test("wer nicht am Zug ist, kann nicht spielen", () => {
  const state = situation([card("fire", 5)], [card("fire", 9)], {
    handSize: 1,
    currentPlayer: 1,
  });

  const result = applyPlayedCard(state, 2, "fire-9");
  assert.equal(result.ok, false);
});

test("Bedienpflicht wird beim Spielen durchgesetzt", () => {
  const state = situation(
    [card("fire", 5), card("water", 2)],
    [card("fire", 9), card("water", 8)],
    { handSize: 2, currentPlayer: 1 },
  );

  const first = applyPlayedCard(state, 1, "fire-5");
  assert.ok(first.ok);

  const wrong = applyPlayedCard(first.state, 2, "water-8");
  assert.equal(wrong.ok, false);
  if (!wrong.ok) {
    assert.match(wrong.reason, /bedienen/);
  }
});

test("nach dem Stich raeumt finishTrick auf, der Gewinner spielt an", () => {
  const state = situation(
    [card("fire", 5), card("water", 2)],
    [card("fire", 9), card("earth", 3)],
    { handSize: 2, currentPlayer: 1 },
  );

  const first = applyPlayedCard(state, 1, "fire-5");
  assert.ok(first.ok);
  const second = applyPlayedCard(first.state, 2, "fire-9");
  assert.ok(second.ok);

  const cleared = finishTrick(second.state);
  assert.ok(cleared);
  assert.equal(cleared.trick.length, 0);
  assert.equal(cleared.phase, "playing");
  assert.equal(cleared.currentPlayer, 2);
});

test("letzte Karte beendet die Runde und rechnet ab", () => {
  const state = situation([card("fire", 5)], [card("fire", 9)], {
    handSize: 1,
    currentPlayer: 1,
    bids: { player1: 1, player2: 1 },
    scores: { player1: 100, player2: 0 },
  });

  const first = applyPlayedCard(state, 1, "fire-5");
  assert.ok(first.ok);
  const second = applyPlayedCard(first.state, 2, "fire-9");
  assert.ok(second.ok);

  const end = second.state;
  assert.equal(end.roundComplete, true);
  // Spieler 1 sagte 1 an, holte 0 -> -10 auf 100.
  assert.equal(end.scores.player1, 90);
  // Spieler 2 sagte 1 an, holte 1 -> +20.
  assert.equal(end.scores.player2, 20);
  assert.equal(end.history.length, 1);
  assert.equal(end.history[0].tricks2, 1);
});

test("die naechste Runde wechselt den Startspieler und teilt neu aus", () => {
  const finished = situation([], [], {
    handSize: 1,
    phase: "trickResult",
    roundComplete: true,
    startingPlayer: 1,
    scores: { player1: 20, player2: -10 },
  });

  const next = startNextRound(finished);

  assert.equal(next.roundIndex, 1);
  assert.equal(next.startingPlayer, 2);
  assert.equal(next.currentPlayer, 2);
  assert.equal(next.phase, "bidding");
  assert.deepEqual(next.scores, { player1: 20, player2: -10 });
  assert.equal(handOf(next, 1).length, 2);
});

test("eine komplette Runde laesst sich ohne Regelverstoss durchspielen", () => {
  let state = createRoundState(4, { player1: 0, player2: 0 }, [], 1);

  state = applyBid(state, 1, 2)!;
  state = applyBid(state, 2, 3)!;
  state = { ...state, phase: "playing", revealUntil: null };

  for (let trick = 0; trick < state.handSize; trick++) {
    for (let step = 0; step < 2; step++) {
      const player = state.currentPlayer;
      const hand = handOf(state, player);
      const playable = hand.find((item) =>
        canPlayCard(item, hand, state.trick),
      );

      assert.ok(playable, "es muss immer eine spielbare Karte geben");

      const result = applyPlayedCard(state, player, playable.id);
      assert.ok(result.ok, result.ok ? "" : result.reason);
      state = result.state;
    }

    if (!state.roundComplete) {
      state = finishTrick(state)!;
    }
  }

  assert.equal(state.roundComplete, true);
  assert.equal(state.tricksWon.player1 + state.tricksWon.player2, 5);
  assert.equal(handOf(state, 1).length, 0);
  assert.equal(handOf(state, 2).length, 0);
  assert.equal(state.history.length, 1);
});
