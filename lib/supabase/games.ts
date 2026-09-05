"use client";

import { createClient } from "./client";
import { isGameState } from "@/lib/game/state";
import { STATE_VERSION } from "@/lib/game/constants";
import type {
  GameRow,
  GameState,
  GameStatus,
  WaitingState,
} from "@/lib/game/types";

// Alle Datenbankzugriffe des Spiels liegen in dieser Datei.
// Die Oberflaeche kennt keine Tabellen und keine Queries -
// das macht spaetere Aenderungen (z. B. Zuege serverseitig
// pruefen) zu einer Aenderung an genau einer Stelle.

let cached: ReturnType<typeof createClient> | null = null;

function db() {
  if (!cached) {
    cached = createClient();
  }

  return cached;
}

function fail(message: string, cause?: { message: string }): never {
  throw new Error(cause?.message ? `${message} (${cause.message})` : message);
}

function createRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function fetchGame(id: string): Promise<GameRow | null> {
  const { data, error } = await db()
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return (data as GameRow) ?? null;
}

export async function createGameRoom(playerName: string): Promise<GameRow> {
  const waiting: WaitingState = { version: STATE_VERSION, waiting: true };

  const { data, error } = await db()
    .from("games")
    .insert({
      code: createRoomCode(),
      player1_name: playerName,
      player2_name: null,
      status: "waiting" satisfies GameStatus,
      game_state: waiting,
    })
    .select("*")
    .single();

  if (error || !data) {
    fail("Spiel konnte nicht erstellt werden.", error ?? undefined);
  }

  return data as GameRow;
}

export async function joinGameRoom(
  code: string,
  playerName: string,
): Promise<GameRow> {
  const { data: found, error: findError } = await db()
    .from("games")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (findError) {
    fail("Suche nach dem Spiel fehlgeschlagen.", findError);
  }

  if (!found) {
    fail("Kein Spiel mit diesem Code gefunden.");
  }

  const room = found as GameRow;

  if (room.player2_name) {
    fail("Dieses Spiel hat bereits zwei Spieler.");
  }

  const { data, error } = await db()
    .from("games")
    .update({
      player2_name: playerName,
      status: "ready" satisfies GameStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id)
    .select("*")
    .single();

  if (error || !data) {
    fail("Beitreten hat nicht funktioniert.", error ?? undefined);
  }

  return data as GameRow;
}

export async function saveState(
  id: string,
  state: GameState,
  status?: GameStatus,
): Promise<GameRow> {
  const { data, error } = await db()
    .from("games")
    .update({
      game_state: state,
      ...(status ? { status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    fail("Spielstand konnte nicht gespeichert werden.", error ?? undefined);
  }

  return data as GameRow;
}

/** Liest den aktuellen Stand, wendet die Aenderung darauf an und
 *  schreibt zurueck. Gibt `update` null zurueck, passiert nichts -
 *  so bleiben doppelt ausgeloeste Aktionen (zwei Clients, zwei
 *  Timer) folgenlos. */
export async function withLatestState(
  id: string,
  update: (state: GameState) => GameState | null,
  status?: GameStatus,
): Promise<GameRow | null> {
  const row = await fetchGame(id);

  if (!row || !isGameState(row.game_state)) {
    return null;
  }

  const next = update(row.game_state);

  if (!next) {
    return null;
  }

  return saveState(id, next, status);
}

export function subscribeToGame(
  id: string,
  onChange: (row: GameRow) => void,
): () => void {
  const channel = db()
    .channel(`two-wizards-${id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "games",
        filter: `id=eq.${id}`,
      },
      (payload) => {
        if (payload.new) {
          onChange(payload.new as GameRow);
        }
      },
    )
    .subscribe();

  return () => {
    void db().removeChannel(channel);
  };
}
