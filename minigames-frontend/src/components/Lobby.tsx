import type { Lobby as LobbyType, MiniGameConfig } from "../../../shared/types";
import "./Lobby.css";

interface LobbyProps {
  lobby: LobbyType;
  currentPlayerId: string;
  availableGames: MiniGameConfig[];
  onStartGame: () => void;
  onLeaveLobby: () => void;
  onTogglePrivacy: (isPrivate: boolean) => void;
  onUpdateSelectedGames: (gameIds: string[]) => void;
}

function getGameName(games: MiniGameConfig[], id: string): string {
  return games.find((g) => g.id === id)?.name ?? id;
}

export function Lobby({
  lobby,
  currentPlayerId,
  availableGames,
  onStartGame,
  onLeaveLobby,
  onTogglePrivacy,
  onUpdateSelectedGames,
}: LobbyProps) {
  const isHost = lobby.hostId === currentPlayerId;
  const canStart =
    lobby.players.length >= 2 && lobby.config.selectedGames.length >= 1;

  const toggleGame = (gameId: string) => {
    const current = lobby.config.selectedGames;
    const isSelected = current.includes(gameId);
    const next = isSelected
      ? current.filter((id) => id !== gameId)
      : [...current, gameId];

    if (next.length === 0) return;
    onUpdateSelectedGames(next);
  };

  const selectAllGames = () => {
    onUpdateSelectedGames(availableGames.map((g) => g.id));
  };

  const selectedSummary = lobby.config.selectedGames
    .map((id) => getGameName(availableGames, id))
    .join(", ");

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <div className="lobby-header">
          <h1>🎮 Lobby</h1>
          <button className="leave-button" onClick={onLeaveLobby}>
            Leave
          </button>
        </div>

        <div className="lobby-code-section">
          <label>Lobby Code</label>
          <div className="lobby-code">{lobby.code}</div>
          <p className="lobby-code-hint">Share this code with your friends!</p>
        </div>

        <div className="lobby-info">
          <div className="info-item">
            <span className="info-label">Points to Win:</span>
            <span className="info-value">{lobby.config.pointsToWin}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Games in rotation:</span>
            <span className="info-value">
              {lobby.config.selectedGames.length}
            </span>
          </div>
          {isHost && (
            <div className="info-item privacy-toggle">
              <span className="info-label">
                {lobby.config.isPrivate ? "🔒 Private" : "🌐 Public"}
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={!lobby.config.isPrivate}
                  onChange={(e) => onTogglePrivacy(!e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          )}
        </div>

        <div className="games-section">
          <h2>Game Rotation</h2>
          <p className="games-hint">
            Each round picks a random game from your selection, without repeating
            until all have been played.
          </p>

          {isHost ? (
            <>
              <div className="games-actions">
                <button
                  type="button"
                  className="games-action-btn"
                  onClick={selectAllGames}
                >
                  Select all
                </button>
              </div>
              <div className="games-list">
                {availableGames.map((game) => {
                  const isSelected = lobby.config.selectedGames.includes(
                    game.id
                  );
                  const isLastSelected =
                    isSelected && lobby.config.selectedGames.length === 1;

                  return (
                    <label
                      key={game.id}
                      className={`game-option ${isSelected ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isLastSelected}
                        onChange={() => toggleGame(game.id)}
                      />
                      <div className="game-option-info">
                        <span className="game-option-name">{game.name}</span>
                        <span className="game-option-desc">
                          {game.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="games-summary">{selectedSummary}</p>
          )}
        </div>

        <div className="players-section">
          <h2>Players ({lobby.players.length})</h2>
          <div className="players-list">
            {lobby.players.map((player) => (
              <div key={player.id} className="player-card">
                <div
                  className="player-color"
                  style={{ backgroundColor: player.color }}
                />
                <div className="player-info">
                  <span className="player-name">
                    {player.username}
                    {player.isHost && " 👑"}
                    {player.id === currentPlayerId && " (You)"}
                  </span>
                  <span className="player-score">Score: {player.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="host-actions">
            {lobby.players.length < 2 && (
              <p className="warning">Need at least 2 players to start</p>
            )}
            {lobby.config.selectedGames.length === 0 && (
              <p className="warning">Select at least one game</p>
            )}
            <button
              className="start-button"
              onClick={onStartGame}
              disabled={!canStart}
            >
              Start Game
            </button>
          </div>
        )}

        {!isHost && (
          <div className="waiting-message">
            <p>Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
}
