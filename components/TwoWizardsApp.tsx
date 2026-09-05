"use client";

import { useState } from "react";
import { FinishedScreen } from "./game/FinishedScreen";
import { GameScreen } from "./game/GameScreen";
import {
  CreateScreen,
  HomeScreen,
  JoinScreen,
  LoadingScreen,
  LobbyScreen,
} from "./screens/MenuScreens";
import { useGameRoom } from "@/lib/hooks/useGameRoom";

/**
 * Verteilt nur noch auf die einzelnen Bildschirme. Die Logik
 * liegt in `useGameRoom`, die Regeln in `lib/game` - hier steht
 * bewusst nichts weiter als die Zuordnung.
 */
export function TwoWizardsApp() {
  const {
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
    actions,
  } = useGameRoom();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  if (screen === "home") {
    return (
      <HomeScreen
        onCreate={() => {
          setError("");
          setScreen("create");
        }}
        onJoin={() => {
          setError("");
          setScreen("join");
        }}
      />
    );
  }

  if (screen === "create") {
    return (
      <CreateScreen
        name={name}
        onNameChange={setName}
        onBack={() => setScreen("home")}
        onSubmit={() => void actions.createRoom(name)}
        loading={loading}
        error={error}
      />
    );
  }

  if (screen === "join") {
    return (
      <JoinScreen
        name={name}
        code={code}
        onNameChange={setName}
        onCodeChange={setCode}
        onBack={() => setScreen("home")}
        onSubmit={() => void actions.joinRoom(name, code)}
        loading={loading}
        error={error}
      />
    );
  }

  if (!game) {
    return <LoadingScreen label="Spiel wird geladen..." />;
  }

  if (screen === "lobby") {
    return (
      <LobbyScreen
        game={game}
        isHost={isHost}
        loading={loading}
        error={error}
        onStart={() => void actions.startMatch()}
        onLeave={actions.leave}
      />
    );
  }

  if (!state || !playerNumber) {
    return <LoadingScreen label="Karten werden gemischt..." />;
  }

  if (state.phase === "finished") {
    return (
      <FinishedScreen game={game} state={state} onRestart={actions.leave} />
    );
  }

  return (
    <GameScreen
      game={game}
      state={state}
      me={playerNumber}
      isHost={isHost}
      notice={notice || error}
      onPlay={(card) => void actions.playCard(card)}
      onBid={(bid) => void actions.placeBid(bid)}
      onNextRound={() => void actions.nextRound()}
      onSay={(text, kind) => void actions.say(text, kind)}
      onLeave={actions.leave}
    />
  );
}
