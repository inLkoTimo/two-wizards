"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createGameRoom,
  fetchGame,
  joinGameRoom,
  saveState,
  subscribeToGame,
  withLatestState,
} from "@/lib/supabase/games";
import { TIMING, TRICK_ANIMATION_MS } from "@/lib/game/constants";
import {
  appendChat,
  applyBid,
  applyPlayedCard,
  createRoundState,
  finishReveal,
  finishTrick,
  isGameState,
  isLastRound,
  startNextRound,
  trickKey,
} from "@/lib/game/state";
import type { Card, GameRow, GameState, Player } from "@/lib/game/types";

export type Screen = "home" | "create" | "join" | "lobby" | "game";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Buendelt alles, was mit der Partie zu tun hat: Verbindung,
 * Live-Updates und die Aktionen der Spieler. Die Komponenten
 * bekommen daraus fertige Funktionen und muessen weder Supabase
 * noch die Spielregeln kennen.
 */
export function useGameRoom() {
  const [menuScreen, setScreen] = useState<Screen>("home");
  const [game, setGame] = useState<GameRow | null>(null);
  const [playerNumber, setPlayerNumber] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gameId = game?.id ?? null;

  const state = useMemo(
    () => (game && isGameState(game.game_state) ? game.game_state : null),
    [game],
  );

  const isHost = playerNumber === 1;

  // Sobald eine Partie verbunden ist, bestimmt deren Status den
  // Bildschirm - abgeleitet statt gespeichert, damit beide Geraete
  // nie auseinanderlaufen koennen.
  const screen: Screen = game
    ? game.status === "playing" || game.status === "finished"
      ? "game"
      : "lobby"
    : menuScreen;

  const showNotice = useCallback((message: string) => {
    setNotice(message);

    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }

    noticeTimer.current = setTimeout(() => setNotice(""), 2600);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    },
    [],
  );

  // --- Live-Verbindung ------------------------------------------------

  useEffect(() => {
    if (!gameId) {
      return;
    }

    return subscribeToGame(gameId, setGame);
  }, [gameId]);

  // Falls eine Live-Meldung verloren geht: beim Zurueckkehren auf
  // den Tab einmal frisch nachladen.
  useEffect(() => {
    if (!gameId) {
      return;
    }

    const refresh = () => {
      if (document.visibilityState === "visible") {
        void fetchGame(gameId).then((row) => {
          if (row) {
            setGame(row);
          }
        });
      }
    };

    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [gameId]);

  // --- Phasen weiterschalten -------------------------------------------
  // Beide Uebergaenge laufen ueber `withLatestState`: der Client
  // liest den aktuellen Stand, prueft ob der Uebergang noch
  // passt, und schreibt erst dann. Loesen beide Clients aus,
  // gewinnt einfach der erste - der zweite findet nichts mehr zu
  // tun und laesst es bleiben.

  const revealKey =
    state && state.phase === "reveal" ? `${state.roundNumber}` : "";

  useEffect(() => {
    if (!gameId || !playerNumber || !revealKey) {
      return;
    }

    const delay =
      TIMING.reveal +
      (playerNumber === 1 ? 0 : TIMING.advanceFallback);

    const timer = setTimeout(() => {
      void withLatestState(gameId, (latest) =>
        latest.phase === "reveal" && `${latest.roundNumber}` === revealKey
          ? finishReveal(latest)
          : null,
      )
        .then((row) => row && setGame(row))
        .catch(() => undefined);
    }, delay);

    return () => clearTimeout(timer);
  }, [gameId, playerNumber, revealKey]);

  const openTrickKey =
    state && state.phase === "trickResult" && !state.roundComplete
      ? trickKey(state.trick)
      : "";

  const trickWinner = state?.lastTrickWinner ?? null;

  useEffect(() => {
    if (!gameId || !playerNumber || !openTrickKey) {
      return;
    }

    // Der Gewinner raeumt ab, sobald seine Animation durch ist.
    // Der andere Client wartet laenger und springt nur ein, falls
    // beim Gewinner etwas haengt.
    const delay =
      TRICK_ANIMATION_MS +
      TIMING.advanceGrace +
      (trickWinner === playerNumber ? 0 : TIMING.advanceFallback);

    const timer = setTimeout(() => {
      void withLatestState(gameId, (latest) =>
        latest.phase === "trickResult" &&
        !latest.roundComplete &&
        trickKey(latest.trick) === openTrickKey
          ? finishTrick(latest)
          : null,
      )
        .then((row) => row && setGame(row))
        .catch(() => undefined);
    }, delay);

    return () => clearTimeout(timer);
  }, [gameId, playerNumber, openTrickKey, trickWinner]);

  // --- Aktionen ---------------------------------------------------------

  const createRoom = useCallback(async (rawName: string) => {
    const playerName = rawName.trim();

    if (!playerName) {
      setError("Bitte gib deinen Namen ein.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const row = await createGameRoom(playerName);
      setGame(row);
      setPlayerNumber(1);
      setScreen("lobby");
    } catch (err) {
      setError(errorMessage(err, "Spiel konnte nicht erstellt werden."));
    } finally {
      setLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (rawName: string, rawCode: string) => {
    const playerName = rawName.trim();
    const code = rawCode.trim().toUpperCase();

    if (!playerName) {
      setError("Bitte gib deinen Namen ein.");
      return;
    }

    if (!code) {
      setError("Bitte gib den Spielcode ein.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const row = await joinGameRoom(code, playerName);
      setGame(row);
      setPlayerNumber(2);
      setScreen("lobby");
    } catch (err) {
      setError(errorMessage(err, "Beitreten hat nicht funktioniert."));
    } finally {
      setLoading(false);
    }
  }, []);

  const startMatch = useCallback(async () => {
    if (!game || !game.player2_name || !isHost) {
      return;
    }

    setLoading(true);

    try {
      const first = createRoundState(
        0,
        { player1: 0, player2: 0 },
        [],
        1,
        [
          {
            id: `chat-${Date.now()}`,
            player: 1,
            text: "Viel Glück! 🪄",
            createdAt: Date.now(),
          },
        ],
      );

      setGame(await saveState(game.id, first, "playing"));
    } catch (err) {
      setError(errorMessage(err, "Spiel konnte nicht gestartet werden."));
    } finally {
      setLoading(false);
    }
  }, [game, isHost]);

  const placeBid = useCallback(
    async (bid: number) => {
      if (!gameId || !playerNumber) {
        return;
      }

      try {
        const row = await withLatestState(gameId, (latest) =>
          applyBid(latest, playerNumber, bid),
        );

        if (row) {
          setGame(row);
        }
      } catch (err) {
        setError(errorMessage(err, "Ansage konnte nicht gespeichert werden."));
      }
    },
    [gameId, playerNumber],
  );

  const playCard = useCallback(
    async (card: Card) => {
      if (!gameId || !playerNumber) {
        return;
      }

      let rejected = "";

      try {
        const row = await withLatestState(gameId, (latest) => {
          const result = applyPlayedCard(latest, playerNumber, card.id);

          if (!result.ok) {
            rejected = result.reason;
            return null;
          }

          return result.state;
        });

        if (rejected) {
          showNotice(rejected);
          return;
        }

        if (row) {
          setGame(row);
        }
      } catch (err) {
        setError(errorMessage(err, "Karte konnte nicht gespielt werden."));
      }
    },
    [gameId, playerNumber, showNotice],
  );

  const nextRound = useCallback(async () => {
    if (!gameId || !isHost) {
      return;
    }

    try {
      const finishing = state ? isLastRound(state) : false;

      const row = await withLatestState(
        gameId,
        (latest) =>
          latest.phase === "trickResult" && latest.roundComplete
            ? startNextRound(latest)
            : null,
        finishing ? "finished" : undefined,
      );

      if (row) {
        setGame(row);
      }
    } catch (err) {
      setError(errorMessage(err, "Neue Runde konnte nicht starten."));
    }
  }, [gameId, isHost, state]);

  const say = useCallback(
    async (text: string, kind: "chat" | "reaction" = "chat") => {
      const message = text.trim();

      if (!message || !gameId || !playerNumber) {
        return;
      }

      try {
        const row = await withLatestState(gameId, (latest: GameState) =>
          appendChat(latest, playerNumber, message, kind),
        );

        if (row) {
          setGame(row);
        }
      } catch {
        // Chat ist nicht spielentscheidend - Fehler bleiben still.
      }
    },
    [gameId, playerNumber],
  );

  const leave = useCallback(() => {
    setGame(null);
    setPlayerNumber(null);
    setError("");
    setNotice("");
    setScreen("home");
  }, []);

  return {
    screen,
    setScreen,
    game,
    state,
    playerNumber,
    isHost,
    loading,
    error,
    notice,
    setError,
    actions: {
      createRoom,
      joinRoom,
      startMatch,
      placeBid,
      playCard,
      nextRound,
      say,
      leave,
    },
  };
}

export type GameRoom = ReturnType<typeof useGameRoom>;
