import { useState } from "react";
import { useSocket } from "./hooks/useSocket";
import { socketService } from "./services/socket";
import { Landing } from "./components/Landing";
import { Lobby } from "./components/Lobby";
import { LobbyList } from "./components/LobbyList";
import { ReactionTime } from "./games/reaction-time";
import { WouldYouRather } from "./games/would-you-rather";
import { RoundResult } from "./components/RoundResult";
import { Victory } from "./components/Victory";
import "./App.css";

function App() {
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
  } = useSocket();

  const currentPlayerId = socketService.getSocket()?.id || "";

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

  // Show victory screen if game ended
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

  // Show round result if round ended (but game not finished)
  if (roundResult && lobby && !gameWinner) {
    const isHost = lobby.hostId === currentPlayerId;
    return (
      <RoundResult
        result={roundResult}
        players={lobby.players}
        isHost={isHost}
        onNextRound={requestNextRound}
      />
    );
  }

  // Show game if in progress
  if (gameData && gameState && lobby?.status === "in_game") {
    if (gameData.gameId === "reaction_time") {
      return <ReactionTime gameState={gameState} onAction={sendGameAction} />;
    }
    if (gameData.gameId === "would_you_rather") {
      return (
        <WouldYouRather gameState={gameState} onAction={sendGameAction} />
      );
    }
  }

  // Show lobby list if browsing
  if (showLobbyList && !lobby) {
    return (
      <LobbyList
        lobbies={publicLobbies}
        onJoinLobby={handleJoinFromList}
        onBack={() => setShowLobbyList(false)}
      />
    );
  }

  // Show lobby if created/joined
  if (lobby && lobby.status === "waiting") {
    return (
      <Lobby
        lobby={lobby}
        currentPlayerId={currentPlayerId}
        onStartGame={startGame}
        onLeaveLobby={leaveLobby}
        onTogglePrivacy={toggleLobbyPrivacy}
      />
    );
  }

  // Show landing page by default
  return (
    <div className="app">
      {!connected && (
        <div className="connection-status">Connecting to server...</div>
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
