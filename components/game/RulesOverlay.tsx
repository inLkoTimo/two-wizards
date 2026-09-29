"use client";

import { useEffect, useState } from "react";
import { CardView } from "./PlayingCard";
import { ROUND_SIZES, SUITS, SUIT_INFO, TOTAL_ROUNDS } from "@/lib/game/constants";
import type { Card, GamePhase, NormalCard, Suit } from "@/lib/game/types";

// Die Anleitung erklaert nicht in Textwaenden, sondern zeigt echte
// Karten - dieselben Komponenten wie am Tisch. Und sie oeffnet dort,
// wo man gerade steht: waehrend der Ansage bei den Punkten, waehrend
// des Spiels beim Stich.

type SectionId = "ziel" | "karten" | "stich" | "bedienen" | "punkte" | "ablauf";

const SECTIONS: { id: SectionId; label: string; title: string }[] = [
  { id: "ziel", label: "Ziel", title: "Worum es geht" },
  { id: "karten", label: "Karten", title: "Die 60 Karten" },
  { id: "stich", label: "Stich", title: "Wer gewinnt den Stich?" },
  { id: "bedienen", label: "Bedienen", title: "Was du spielen darfst" },
  { id: "punkte", label: "Punkte", title: "So wird gewertet" },
  { id: "ablauf", label: "Ablauf", title: "Der Weg durch 19 Runden" },
];

/** Welcher Abschnitt passt zu dem, was gerade auf dem Tisch liegt. */
function sectionForPhase(phase?: GamePhase): SectionId {
  switch (phase) {
    case "bidding":
      return "punkte";
    case "reveal":
      return "ablauf";
    case "playing":
      return "bedienen";
    case "trickResult":
      return "stich";
    case "finished":
      return "punkte";
    default:
      return "ziel";
  }
}

const PHASE_LABEL: Partial<Record<GamePhase, string>> = {
  bidding: "du sagst gerade an",
  reveal: "die Ansagen sind offen",
  playing: "ihr spielt gerade",
  trickResult: "der Stich wird ausgewertet",
  finished: "das Spiel ist vorbei",
};

function normal(suit: Suit, value: number): NormalCard {
  return { id: `rules-${suit}-${value}`, type: "normal", suit, value };
}

const WIZARD: Card = { id: "rules-wizard", type: "wizard" };
const WITCH: Card = { id: "rules-witch", type: "witch" };

function labelOf(card: Card): string {
  if (card.type === "wizard") return "Wizard";
  if (card.type === "witch") return "Hexe";
  return `${SUIT_INFO[card.suit].name} ${card.value}`;
}

/** Zwei Karten gegeneinander - die gewinnende bekommt den Rahmen. */
function Duel({
  left,
  right,
  winner,
  note,
}: {
  left: Card;
  right: Card;
  winner: "left" | "right";
  note: string;
}) {
  const side = (card: Card, isWinner: boolean) => (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <div
        className={[
          "rounded-xl p-1 transition",
          isWinner
            ? "bg-amber-400/15 ring-2 ring-amber-300/70"
            : "opacity-55 ring-1 ring-white/10",
        ].join(" ")}
      >
        <CardView card={card} size="mini" />
      </div>

      <span
        className={[
          "max-w-[5.5rem] truncate text-[10px]",
          isWinner ? "font-bold text-amber-200" : "text-slate-500",
        ].join(" ")}
      >
        {labelOf(card)}
      </span>
    </div>
  );

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="flex shrink-0 items-start gap-2">
        {side(left, winner === "left")}
        <span className="mt-4 text-xs text-slate-600">vs</span>
        {side(right, winner === "right")}
      </div>

      <p className="min-w-0 flex-1 text-[13px] leading-snug text-slate-300">
        {note}
      </p>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[13px] leading-relaxed text-slate-300">
      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-300/70" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

type RulesContext = {
  phase?: GamePhase;
  trump?: Suit;
  handSize?: number;
};

export function RulesOverlay({
  open,
  onClose,
  ...context
}: RulesContext & { open: boolean; onClose: () => void }) {
  // Der Dialog wird bei jedem Oeffnen neu aufgebaut. Dadurch startet
  // er von sich aus im passenden Abschnitt, ohne dass ein Effekt den
  // Zustand hinterher korrigieren muss.
  if (!open) {
    return null;
  }

  return <RulesDialog onClose={onClose} {...context} />;
}

function RulesDialog({
  onClose,
  phase,
  trump,
  handSize,
}: RulesContext & { onClose: () => void }) {
  const suggested = sectionForPhase(phase);
  const [active, setActive] = useState<SectionId>(suggested);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trumpSuit: Suit = trump ?? "earth";
  const foreign: Suit = SUITS.find((suit) => suit !== trumpSuit) ?? "fire";
  const trumpInfo = SUIT_INFO[trumpSuit];
  const foreignInfo = SUIT_INFO[foreign];
  const cards = handSize ?? 5;
  const section = SECTIONS.find((item) => item.id === active) ?? SECTIONS[0];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Spielregeln"
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b1119] text-white shadow-2xl sm:max-h-[86dvh] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Kopf */}
        <div className="shrink-0 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧙</span>
                <h2 className="font-serif text-lg font-black text-amber-200 sm:text-xl">
                  Spielregeln
                </h2>
              </div>

              {phase && PHASE_LABEL[phase] && (
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Gerade offen, weil {PHASE_LABEL[phase]}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Regeln schließen"
              className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-400 hover:border-white/30 hover:text-white"
            >
              Schließen
            </button>
          </div>

          {/* Reiter */}
          <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {SECTIONS.map((item) => {
              const isActive = item.id === active;
              const isSuggested = item.id === suggested && Boolean(phase);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className={[
                    "relative shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    isActive
                      ? "border-amber-300/60 bg-amber-400/15 text-amber-100"
                      : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}

                  {isSuggested && (
                    <span
                      aria-label="passt zur aktuellen Phase"
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-300"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inhalt */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
          <h3 className="mb-3 font-serif text-xl font-bold sm:text-2xl">
            {section.title}
          </h3>

          {active === "ziel" && (
            <div className="space-y-3">
              <p className="text-[15px] leading-relaxed text-slate-200">
                Vor jeder Runde sagst du an, wie viele Stiche du holen wirst.
                Danach zählt nur eins: <b className="text-amber-200">die Zahl
                genau treffen</b>. Nicht mehr, nicht weniger.
              </p>

              <ul className="space-y-2">
                <Rule>
                  Zu wenige Stiche kosten Punkte. Zu viele aber genauso – das
                  ist der Dreh am Spiel.
                </Rule>
                <Rule>
                  Manchmal ist die beste Ansage <b>null</b>. Dann musst du jeden
                  Stich aktiv verlieren.
                </Rule>
                <Rule>
                  Nach {TOTAL_ROUNDS} Runden gewinnt, wer die meisten Punkte hat.
                </Rule>
              </ul>
            </div>
          )}

          {active === "karten" && (
            <div className="space-y-4">
              <p className="text-[15px] leading-relaxed text-slate-200">
                60 Karten: vier Elemente mit je 13 Zahlen, dazu vier Wizards und
                vier Hexen.
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SUITS.map((suit) => (
                  <div
                    key={suit}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-2"
                  >
                    <CardView card={normal(suit, 13)} size="mini" />
                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-xs font-bold">
                        {SUIT_INFO[suit].emoji} {SUIT_INFO[suit].name}
                      </div>
                      <div className="text-[10px] text-slate-500">1 bis 13</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-violet-300/25 bg-violet-500/10 p-3">
                  <CardView card={WIZARD} size="mini" />
                  <p className="min-w-0 text-[13px] leading-snug text-slate-300">
                    <b className="text-violet-200">Wizard</b> schlägt alles –
                    auch Trumpf. 4 Stück im Spiel.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-3">
                  <CardView card={WITCH} size="mini" />
                  <p className="min-w-0 text-[13px] leading-snug text-slate-300">
                    <b className="text-fuchsia-200">Hexe</b> verliert gegen
                    alles. Dein Werkzeug, um Stiche loszuwerden.
                  </p>
                </div>
              </div>
            </div>
          )}

          {active === "stich" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-[13px]">
                <span className="text-slate-300">
                  {trump ? "In dieser Runde ist Trumpf:" : "Beispiel-Trumpf:"}
                </span>
                <b className="text-amber-100">
                  {trumpInfo.emoji} {trumpInfo.name}
                </b>
              </div>

              <div className="space-y-2">
                <Duel
                  left={WIZARD}
                  right={normal(trumpSuit, 13)}
                  winner="left"
                  note="Der Wizard schlägt jede Karte. Liegen zwei Wizards, gewinnt der zuerst gespielte."
                />

                <Duel
                  left={WITCH}
                  right={normal(foreign, 1)}
                  winner="right"
                  note={`Die Hexe verliert gegen alles – selbst gegen ${foreignInfo.name} 1.`}
                />

                <Duel
                  left={normal(foreign, 13)}
                  right={normal(trumpSuit, 2)}
                  winner="right"
                  note={`Trumpf schlägt jede fremde Farbe – die kleine ${trumpInfo.name} 2 gewinnt gegen die hohe ${foreignInfo.name} 13.`}
                />

                <Duel
                  left={normal(foreign, 11)}
                  right={normal(foreign, 4)}
                  winner="left"
                  note="Gleiche Farbe: Die höhere Zahl gewinnt."
                />
              </div>

              <p className="text-[13px] leading-relaxed text-slate-400">
                Ohne Trumpf und ohne gleiche Farbe gewinnt die Karte, die
                angespielt wurde – eine fremde Farbe hinterher zählt nicht.
              </p>
            </div>
          )}

          {active === "bedienen" && (
            <div className="space-y-4">
              <p className="text-[15px] leading-relaxed text-slate-200">
                Wer als Zweiter spielt, ist nicht frei: Du musst die
                angespielte Farbe <b className="text-amber-200">bedienen</b>,
                wenn du sie auf der Hand hast.
              </p>

              <ul className="space-y-2">
                <Rule>
                  Hast du die Farbe nicht, darfst du alles legen – auch Trumpf.
                </Rule>
                <Rule>
                  <b>Wizard und Hexe</b> darfst du immer spielen, egal was liegt.
                </Rule>
                <Rule>
                  Eine angespielte <b>Hexe legt keine Farbe fest</b>. Dann
                  bestimmt erst die zweite Karte, worum es im Stich geht.
                </Rule>
                <Rule>
                  Karten, die du nicht spielen darfst, lassen sich am Tisch gar
                  nicht erst anklicken – du kannst also nichts falsch machen.
                </Rule>
              </ul>
            </div>
          )}

          {active === "punkte" && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/70">
                    Genau getroffen
                  </div>
                  <div className="mt-1 text-lg font-black text-emerald-200">
                    10 + 10 pro Stich
                  </div>
                </div>

                <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-red-300/70">
                    Daneben
                  </div>
                  <div className="mt-1 text-lg font-black text-red-200">
                    −10 je Stich Abstand
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                      <th className="py-1.5 pr-3 font-medium">Angesagt</th>
                      <th className="py-1.5 pr-3 font-medium">Geholt</th>
                      <th className="py-1.5 font-medium">Punkte</th>
                    </tr>
                  </thead>
                  <tbody className="font-variant-numeric tabular-nums">
                    {[
                      { bid: 0, tricks: 0, points: 10 },
                      { bid: 2, tricks: 2, points: 30 },
                      { bid: 3, tricks: 3, points: 40 },
                      { bid: 3, tricks: 2, points: -10 },
                      { bid: 1, tricks: 4, points: -30 },
                    ].map((row) => (
                      <tr
                        key={`${row.bid}-${row.tricks}`}
                        className="border-t border-white/5"
                      >
                        <td className="py-1.5 pr-3">{row.bid}</td>
                        <td className="py-1.5 pr-3">{row.tricks}</td>
                        <td
                          className={[
                            "py-1.5 font-bold",
                            row.points >= 0
                              ? "text-emerald-300"
                              : "text-red-300",
                          ].join(" ")}
                        >
                          {row.points > 0 ? "+" : ""}
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[13px] leading-relaxed text-slate-400">
                Beide sagen gleichzeitig an, keiner sieht die Zahl des anderen.
                {handSize
                  ? ` In dieser Runde geht die Ansage von 0 bis ${cards}.`
                  : ""}
              </p>
            </div>
          )}

          {active === "ablauf" && (
            <div className="space-y-4">
              <ol className="space-y-2.5">
                {[
                  "Karten werden ausgeteilt, eine weitere wird aufgedeckt – ihre Farbe ist Trumpf für diese Runde.",
                  "Beide sagen gleichzeitig an, wie viele Stiche sie holen wollen.",
                  "Die Ansagen werden aufgedeckt, dann wird gespielt.",
                  "Nach jedem Stich spielt der Gewinner die nächste Karte an.",
                  "Am Rundenende wird abgerechnet, danach wird neu gemischt.",
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[11px] font-black text-amber-200">
                      {index + 1}
                    </span>
                    <span className="min-w-0 text-[13px] leading-relaxed text-slate-300">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Kartenzahl je Runde
                </div>

                <div className="mt-2 flex items-end gap-[3px]">
                  {ROUND_SIZES.map((size, index) => (
                    <div
                      key={index}
                      title={`Runde ${index + 1}: ${size} ${size === 1 ? "Karte" : "Karten"}`}
                      className="flex-1 rounded-t bg-amber-300/35"
                      style={{ height: `${8 + size * 4}px` }}
                    />
                  ))}
                </div>

                <p className="mt-2 text-[12px] text-slate-400">
                  Von 1 Karte hoch auf 10 und wieder zurück – {TOTAL_ROUNDS}{" "}
                  Runden. Der Startspieler wechselt jede Runde.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
