import type { Lobby as LobbyType } from "../../../shared/types";
import "./Lobby.css";

interface LobbyProps {
  lobby: LobbyType;
  currentPlayerId: string;
  onStartGame: () => void;
  onLeaveLobby: () => void;
  onTogglePrivacy: (isPrivate: boolean) => void;
}

export function Lobby({
  lobby,
  currentPlayerId,
  onStartGame,
  onLeaveLobby,
  onTogglePrivacy,
}: LobbyProps) {
  const isHost = lobby.hostId === currentPlayerId;
  const canStart = lobby.players.length >= 2;

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
            <span className="info-label">Game Mode:</span>
            <span className="info-value">{lobby.config.gameMode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Points to Win:</span>
            <span className="info-value">{lobby.config.pointsToWin}</span>
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
            {!canStart && (
              <p className="warning">Need at least 2 players to start</p>
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
