import { useState } from "react";
import { useSocket } from "./hooks/useSocket";
import { socketService } from "./services/socket";
import { useTranslation } from "./i18n/I18nContext";
import { Landing } from "./components/Landing";
import { Lobby } from "./components/Lobby";
import { LobbyList } from "./components/LobbyList";
import { LanguagePicker } from "./components/LanguagePicker";
import { ReactionTime } from "./games/reaction-time";
import { WouldYouRather } from "./games/would-you-rather";
import { HigherLower } from "./games/higher-lower";
import { NumberGuessing } from "./games/number-guessing";
import { FinishThePhrase } from "./games/finish-the-phrase";
import { RoundResult } from "./components/RoundResult";
import { Victory } from "./components/Victory";
import "./App.css";

function App() {
  const { t, ready } = useTranslation();
  const [showLobbyList, setShowLobbyList] = useState(false);
  const {
    connected,
    lobby,
    gameData,
    gameState,
    roundResult,
    gameWinner,
    error,
    publicLobbies,
    createLobby,
    joinLobby,
    leaveLobby,
    startGame,
    sendGameAction,
    requestNextRound,
    getPublicLobbies,
    toggleLobbyPrivacy,
    availableGames,
    updateSelectedGames,
    endSession,
  } = useSocket();

  const currentPlayerId = socketService.getSocket()?.id || "";

  if (!ready) {
    return <LanguagePicker />;
  }

  const handleBrowseLobbies = () => {
    getPublicLobbies();
    setShowLobbyList(true);
  };

  const handleJoinFromList = (
    code: string,
    username: string,
    color: string
  ) => {
    joinLobby(code, username, color);
    setShowLobbyList(false);
  };

  if (gameWinner && lobby) {
    return (
      <Victory
        winner={gameWinner}
        players={lobby.players}
        onReturnToLobby={() => {
          // Victory screen will auto-hide after server resets lobby
        }}
      />
    );
  }

  if (roundResult && lobby && !gameWinner) {
    const isHost = lobby.hostId === currentPlayerId;
    return (
      <RoundResult
        result={roundResult}
        players={lobby.players}
        isHost={isHost}
        onNextRound={requestNextRound}
        onEndSession={endSession}
      />
    );
  }

  if (gameData && gameState && lobby?.status === "in_game") {
    const isHost = lobby.hostId === currentPlayerId;

    const gameView = (() => {
      if (gameData.gameId === "reaction_time") {
        return <ReactionTime gameState={gameState} onAction={sendGameAction} />;
      }
      if (gameData.gameId === "would_you_rather") {
        return (
          <WouldYouRather gameState={gameState} onAction={sendGameAction} />
        );
      }
      if (gameData.gameId === "higher_lower") {
        return <HigherLower gameState={gameState} onAction={sendGameAction} />;
      }
      if (gameData.gameId === "number_guessing") {
        return (
          <NumberGuessing
            gameState={gameState}
            onAction={sendGameAction}
            playerId={currentPlayerId}
          />
        );
      }
      if (gameData.gameId === "finish_the_phrase") {
        return (
          <FinishThePhrase
            gameState={gameState}
            onAction={sendGameAction}
            playerId={currentPlayerId}
          />
        );
      }
      return null;
    })();

    if (gameView) {
      return (
        <div className="game-session">
          {isHost && (
            <button className="end-session-button" onClick={endSession}>
              {t("app.backToLobby")}
            </button>
          )}
          {gameView}
        </div>
      );
    }
  }

  if (showLobbyList && !lobby) {
    return (
      <LobbyList
        lobbies={publicLobbies}
        onJoinLobby={handleJoinFromList}
        onBack={() => setShowLobbyList(false)}
      />
    );
  }

  if (lobby && lobby.status === "waiting") {
    return (
      <Lobby
        lobby={lobby}
        currentPlayerId={currentPlayerId}
        availableGames={availableGames}
        onStartGame={startGame}
        onLeaveLobby={leaveLobby}
        onTogglePrivacy={toggleLobbyPrivacy}
        onUpdateSelectedGames={updateSelectedGames}
      />
    );
  }

  return (
    <div className="app">
      {!connected && (
        <div className="connection-status">{t("app.connecting")}</div>
      )}
      <Landing
        onCreateLobby={createLobby}
        onJoinLobby={joinLobby}
        onBrowseLobbies={handleBrowseLobbies}
        error={error}
      />
    </div>
  );
}

export default App;
