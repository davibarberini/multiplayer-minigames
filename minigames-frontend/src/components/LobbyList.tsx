import { useState } from "react";
import type { Lobby } from "../../../shared/types";
import { PLAYER_COLORS } from "../../../shared/constants";
import "./LobbyList.css";

interface LobbyListProps {
  lobbies: Lobby[];
  onJoinLobby: (code: string, username: string, color: string) => void;
  onBack: () => void;
}

export function LobbyList({ lobbies, onJoinLobby, onBack }: LobbyListProps) {
  const [selectedLobby, setSelectedLobby] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [selectedColor, setSelectedColor] = useState<
    (typeof PLAYER_COLORS)[number]
  >(PLAYER_COLORS[0]);

  const handleJoinClick = (lobbyCode: string) => {
    setSelectedLobby(lobbyCode);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLobby && username.trim()) {
      onJoinLobby(selectedLobby, username.trim(), selectedColor);
    }
  };

  const handleCancelJoin = () => {
    setSelectedLobby(null);
    setUsername("");
  };
  return (
    <div className="lobby-list-container">
      {selectedLobby && (
        <div className="join-modal-overlay" onClick={handleCancelJoin}>
          <div className="join-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Join Lobby {selectedLobby}</h2>
            <form onSubmit={handleJoinSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  maxLength={20}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Choose Your Color</label>
                <div className="color-picker">
                  {PLAYER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${
                        selectedColor === color ? "selected" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancelJoin}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={!username.trim()}
                >
                  Join Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="lobby-list-card">
        <div className="lobby-list-header">
          <h1>🎮 Public Lobbies</h1>
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
        </div>

        {lobbies.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">😔</p>
            <p className="empty-text">No public lobbies available</p>
            <p className="empty-hint">Create your own or check back later!</p>
          </div>
        ) : (
          <div className="lobbies-grid">
            {lobbies.map((lobby) => (
              <div key={lobby.code} className="lobby-item">
                <div className="lobby-item-header">
                  <h3 className="lobby-code">{lobby.code}</h3>
                  <span className="lobby-status">
                    {lobby.players.length} / {lobby.config.maxPlayers || 8}{" "}
                    players
                  </span>
                </div>

                <div className="lobby-item-info">
                  <div className="info-row">
                    <span className="info-label">Game:</span>
                    <span className="info-value">{lobby.config.gameMode}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Points to Win:</span>
                    <span className="info-value">
                      {lobby.config.pointsToWin}
                    </span>
                  </div>
                </div>

                <div className="lobby-item-players">
                  {lobby.players.slice(0, 4).map((player) => (
                    <div
                      key={player.id}
                      className="player-avatar"
                      style={{ backgroundColor: player.color }}
                      title={player.username}
                    >
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {lobby.players.length > 4 && (
                    <div className="player-avatar more">
                      +{lobby.players.length - 4}
                    </div>
                  )}
                </div>

                <button
                  className="join-lobby-button"
                  onClick={() => handleJoinClick(lobby.code)}
                  disabled={
                    lobby.config.maxPlayers
                      ? lobby.players.length >= lobby.config.maxPlayers
                      : lobby.players.length >= 8
                  }
                >
                  {lobby.config.maxPlayers &&
                  lobby.players.length >= lobby.config.maxPlayers
                    ? "Full"
                    : "Join Lobby"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
