"use client";

import { useEffect, useRef, useState } from "react";
import { TIMING } from "@/lib/game/constants";
import { trickKey } from "@/lib/game/state";
import type { GameState, PlayedCard, Player } from "@/lib/game/types";

export type TrickAnimation = {
  key: string;
  cards: PlayedCard[];
  winner: Player;
  stage: "settle" | "fly";
};

/**
 * Spielt den Stich lokal ab - unabhaengig davon, wann die
 * Datenbank den naechsten Zustand liefert.
 *
 * Das ist der Kern der Korrektur: vorher haingen die Karten an
 * einem Zeitstempel, den ein Client erzeugt hat. Wer die Meldung
 * spaeter bekam (Latenz) oder eine leicht abweichende Systemuhr
 * hatte, sah die zweite Karte nur kurz - oder gar nicht.
 *
 * Jetzt merkt sich jeder Client den Stich selbst und zeigt ihn
 * volle `trickSettle` Millisekunden, danach fliegen die Karten
 * zum Gewinner. Auch wenn der geteilte Zustand laengst weiter
 * ist, laeuft die Animation hier sauber zu Ende.
 */
export function useTrickAnimation(state: GameState | null) {
  const [animation, setAnimation] = useState<TrickAnimation | null>(null);
  const [bumpWinner, setBumpWinner] = useState<Player | null>(null);

  // Der Ref wird in einem eigenen Effekt gepflegt (nicht waehrend
  // des Renderns). Da dieser Effekt vor dem Animations-Effekt
  // deklariert ist, laeuft er auch zuerst - der Wert ist dort also
  // immer aktuell.
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const activeKey =
    state &&
    state.phase === "trickResult" &&
    state.trick.length === 2 &&
    state.lastTrickWinner
      ? trickKey(state.trick)
      : "";

  useEffect(() => {
    if (!activeKey) {
      return;
    }

    const current = stateRef.current;

    if (!current || !current.lastTrickWinner) {
      return;
    }

    const winner = current.lastTrickWinner;

    setAnimation({
      key: activeKey,
      cards: current.trick,
      winner,
      stage: "settle",
    });
    setBumpWinner(null);

    const flyTimer = setTimeout(() => {
      setAnimation((previous) =>
        previous && previous.key === activeKey
          ? { ...previous, stage: "fly" }
          : previous,
      );
    }, TIMING.trickSettle);

    const landTimer = setTimeout(() => {
      setAnimation((previous) =>
        previous && previous.key === activeKey ? null : previous,
      );
      setBumpWinner(winner);
    }, TIMING.trickSettle + TIMING.trickFly);

    const bumpTimer = setTimeout(
      () => setBumpWinner(null),
      TIMING.trickSettle + TIMING.trickFly + TIMING.trickBump,
    );

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(landTimer);
      clearTimeout(bumpTimer);
    };
  }, [activeKey]);

  return {
    animation,
    bumpWinner,
    /** Solange die Karten noch fliegen, ist der Stich in der
     *  Datenbank bereits gutgeschrieben. Der Stapel soll aber
     *  erst wachsen, wenn die Karten ankommen. */
    pendingWinner: animation?.winner ?? null,
  };
}
