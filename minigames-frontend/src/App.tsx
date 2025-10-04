import { useSocket } from "./hooks/useSocket";
import { socketService } from "./services/socket";
import { Landing } from "./components/Landing";
import { Lobby } from "./components/Lobby";
import { ReactionTime } from "./games/ReactionTime";
import { RoundResult } from "./components/RoundResult";
import { Victory } from "./components/Victory";
import "./App.css";

function App() {
  const {
    connected,
    lobby,
    gameData,
    gameState,
    roundResult,
    gameWinner,
    error,
    createLobby,
    joinLobby,
    leaveLobby,
    startGame,
    sendGameAction,
    requestNextRound,
  } = useSocket();

  const currentPlayerId = socketService.getSocket()?.id || "";

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
    // For now, we only have Reaction Time game
    if (gameData.gameId === "reaction_time") {
      return <ReactionTime gameState={gameState} onAction={sendGameAction} />;
    }
  }

  // Show lobby if created/joined
  if (lobby && lobby.status === "waiting") {
    return (
      <Lobby
        lobby={lobby}
        currentPlayerId={currentPlayerId}
        onStartGame={startGame}
        onLeaveLobby={leaveLobby}
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
        error={error}
      />
    </div>
  );
}

export default App;
