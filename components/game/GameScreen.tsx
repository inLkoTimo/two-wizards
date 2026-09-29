"use client";

import { useState } from "react";
import { BiddingPanel } from "./BiddingPanel";
import { ChatPanel } from "./ChatPanel";
import { HandRow } from "./HandRow";
import { CardBack, CardView } from "./PlayingCard";
import { PlayerStrip } from "./PlayerStrip";
import { RevealPanel } from "./RevealPanel";
import { RulesOverlay } from "./RulesOverlay";
import { ScorePanel } from "./ScorePanel";
import { TrickArea } from "./TrickArea";
import { SUIT_INFO, TOTAL_ROUNDS } from "@/lib/game/constants";
import { canPlayCard, getLeadSuit } from "@/lib/game/rules";
import { bidOf, handOf, isLastRound, tricksOf } from "@/lib/game/state";
import { useTrickAnimation } from "@/lib/hooks/useTrickAnimation";
import {
  otherPlayer,
  type Card,
  type GameRow,
  type GameState,
  type Player,
} from "@/lib/game/types";

export function GameScreen({
  game,
  state,
  me,
  isHost,
  notice,
  onPlay,
  onBid,
  onNextRound,
  onSay,
  onLeave,
}: {
  game: GameRow;
  state: GameState;
  me: Player;
  isHost: boolean;
  notice: string;
  onPlay: (card: Card) => void;
  onBid: (bid: number) => void;
  onNextRound: () => void;
  onSay: (text: string, kind?: "chat" | "reaction") => void;
  onLeave: () => void;
}) {
  const { animation, bumpWinner, pendingWinner } = useTrickAnimation(state);
  const [panel, setPanel] = useState<"chat" | "score" | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const opponent = otherPlayer(me);

  const player1Name = game.player1_name;
  const player2Name = game.player2_name ?? "Wizard 2";
  const nameOf = (player: Player) =>
    player === 1 ? player1Name : player2Name;

  const opponentName = nameOf(opponent);

  const myHand = handOf(state, me);
  const opponentCards = handOf(state, opponent).length;

  // Waehrend die Karten noch zum Gewinner fliegen, waechst der
  // Stapel bewusst noch nicht - er waechst genau beim Aufkommen.
  const pileOf = (player: Player) =>
    tricksOf(state, player) - (pendingWinner === player ? 1 : 0);

  const sublineOf = (player: Player) => {
    if (state.phase === "bidding") {
      return state.startingPlayer === player ? "spielt an" : "sagt an";
    }

    const bid = bidOf(state, player);
    return bid === null ? "ohne Ansage" : `Ansage ${bid}`;
  };

  const inTrickPhase =
    state.phase === "playing" || state.phase === "trickResult";

  const myTurn = state.currentPlayer === me;
  const leadSuit = getLeadSuit(state.trick);
  const roundOver = state.phase === "trickResult" && state.roundComplete;

  const panelProps = {
    messages: state.chat,
    me,
    player1Name,
    player2Name,
    onSend: onSay,
  };

  const scoreProps = {
    history: state.history,
    scores: state.scores,
    player1Name,
    player2Name,
  };

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#04070b] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#060a10] px-3 sm:h-16 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="text-2xl">🧙</span>

          <span className="hidden font-serif text-xl font-black text-amber-200 md:block">
            Two Wizards
          </span>

          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-400">
            Raum <span className="font-bold text-white">{game.code}</span>
          </span>

          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-400">
            Runde{" "}
            <span className="font-bold text-white">{state.roundNumber}</span>
            <span className="hidden sm:inline">/{TOTAL_ROUNDS}</span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            aria-label="Spielregeln öffnen"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300/30 bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-100 hover:border-amber-300/60"
          >
            <span aria-hidden>?</span>
            <span className="hidden sm:inline">Regeln</span>
          </button>

          <button
            type="button"
            onClick={onLeave}
            className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-400 hover:border-white/30 hover:text-white"
          >
            Verlassen
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-[minmax(190px,230px)_minmax(0,1fr)_minmax(230px,290px)] lg:gap-3 lg:p-3">
        <div className="hidden min-h-0 lg:flex">
          <ChatPanel {...panelProps} />
        </div>

        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border-2 border-[#34251a] bg-[radial-gradient(circle_at_center,#235f42,#123b2b_52%,#081b13)] shadow-2xl sm:rounded-[1.75rem] sm:border-4">
          {/* Gegner + Trumpf */}
          <div className="flex shrink-0 items-stretch gap-2 p-2 sm:p-3">
            <PlayerStrip
              name={opponentName}
              isMe={false}
              subline={sublineOf(opponent)}
              tricks={pileOf(opponent)}
              isActive={inTrickPhase && state.currentPlayer === opponent}
              bump={bumpWinner === opponent}
              accent={opponent === 1 ? "purple" : "blue"}
            />

            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-amber-300/30 bg-black/40 px-2 py-1.5">
              <CardView card={state.trumpCard} size="mini" />

              <div className="hidden leading-tight sm:block">
                <div className="text-[9px] uppercase tracking-[0.2em] text-amber-200/60">
                  Trumpf
                </div>

                <div className="text-xs font-black">
                  {SUIT_INFO[state.trump].emoji} {SUIT_INFO[state.trump].name}
                </div>
              </div>
            </div>
          </div>

          {/* Verdeckte Karten des Gegners */}
          <div className="flex shrink-0 justify-center overflow-hidden px-2 [@media(max-height:460px)]:hidden">
            <div className="flex -space-x-4 sm:-space-x-6">
              {Array.from({ length: opponentCards }, (_, index) => (
                <CardBack key={index} size="mini" />
              ))}
            </div>
          </div>

          {/* Tischmitte */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-2 py-3">
            {state.phase === "bidding" && (
              <BiddingPanel
                handSize={state.handSize}
                myBid={bidOf(state, me)}
                opponentHasBid={bidOf(state, opponent) !== null}
                opponentName={opponentName}
                iStart={state.startingPlayer === me}
                onBid={onBid}
              />
            )}

            {state.phase === "reveal" && (
              <RevealPanel
                player1Name={player1Name}
                player2Name={player2Name}
                bid1={state.bids.player1}
                bid2={state.bids.player2}
              />
            )}

            {inTrickPhase && (
              <>
                <div className="text-center">
                  <div
                    className={
                      myTurn
                        ? "text-sm font-black text-emerald-200"
                        : "text-sm text-emerald-100/50"
                    }
                  >
                    {state.phase === "trickResult"
                      ? "Stich wird ausgewertet"
                      : myTurn
                        ? "✨ Du bist dran"
                        : `🪄 ${opponentName} ist dran`}
                  </div>

                  {leadSuit && state.phase === "playing" && (
                    <div className="mt-0.5 text-[11px] text-emerald-100/40">
                      Angespielt: {SUIT_INFO[leadSuit].emoji}{" "}
                      {SUIT_INFO[leadSuit].name}
                    </div>
                  )}
                </div>

                <TrickArea
                  trick={state.trick}
                  animation={animation}
                  me={me}
                  opponentName={opponentName}
                  winnerName={
                    state.lastTrickWinner
                      ? nameOf(state.lastTrickWinner)
                      : null
                  }
                />
              </>
            )}

            {roundOver && (
              <div className="w-full max-w-sm rounded-3xl border border-amber-300/20 bg-black/70 px-6 py-4 text-center backdrop-blur">
                <div className="text-2xl">🏆</div>

                <div className="mt-1 text-sm font-black">
                  Runde {state.roundNumber} beendet
                </div>

                {isHost ? (
                  <button
                    type="button"
                    onClick={onNextRound}
                    className="mt-3 w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-100"
                  >
                    {isLastRound(state)
                      ? "Spiel beenden 🏆"
                      : "Neue Runde – Ansagen ✨"}
                  </button>
                ) : (
                  <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    Warte auf {player1Name}...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Eigene Leiste + Hand */}
          <div className="shrink-0 px-2 pb-2 sm:px-3">
            <PlayerStrip
              name={me === 1 ? player1Name : player2Name}
              isMe
              subline={sublineOf(me)}
              tricks={pileOf(me)}
              isActive={inTrickPhase && myTurn}
              bump={bumpWinner === me}
              accent={me === 1 ? "purple" : "blue"}
            />

            <HandRow
              hand={myHand}
              isPlayable={(card) =>
                state.phase === "playing" &&
                myTurn &&
                canPlayCard(card, myHand, state.trick)
              }
              onPlay={onPlay}
            />
          </div>

          {notice && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 w-[90%] max-w-sm -translate-x-1/2 rounded-2xl border border-red-400/20 bg-red-950/95 px-4 py-2.5 text-center text-sm text-red-100 shadow-2xl">
              {notice}
            </div>
          )}
        </section>

        <div className="hidden min-h-0 lg:flex">
          <ScorePanel {...scoreProps} />
        </div>
      </div>

      {/* Auf kleinen Geraeten liegen Chat und Punkte in Schubladen,
          damit der Kartentisch die volle Breite bekommt. */}
      <nav className="flex shrink-0 gap-2 border-t border-white/10 bg-[#060a10] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <button
          type="button"
          onClick={() => setPanel("chat")}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold"
        >
          💬 Chat
        </button>

        <button
          type="button"
          onClick={() => setPanel("score")}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold"
        >
          🏅 Punkte
        </button>
      </nav>

      {panel && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setPanel(null)}
        >
          <div
            className="flex h-[78dvh] flex-col p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="mx-auto mb-2 w-28 rounded-full bg-white/20 py-1 text-xs"
            >
              schließen
            </button>

            {panel === "chat" ? (
              <ChatPanel {...panelProps} />
            ) : (
              <ScorePanel {...scoreProps} />
            )}
          </div>
        </div>
      )}

      <RulesOverlay
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        phase={state.phase}
        trump={state.trump}
        handSize={state.handSize}
      />
    </main>
  );
}
