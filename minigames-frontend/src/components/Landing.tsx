import { useState } from "react";
import { PLAYER_COLORS } from "../../../shared/constants";
import "./Landing.css";

interface LandingProps {
  onCreateLobby: (username: string, color: string) => void;
  onJoinLobby: (code: string, username: string, color: string) => void;
  onBrowseLobbies: () => void;
  error: string | null;
}

export function Landing({
  onCreateLobby,
  onJoinLobby,
  onBrowseLobbies,
  error,
}: LandingProps) {
  const [username, setUsername] = useState("");
  const [selectedColor, setSelectedColor] = useState<
    (typeof PLAYER_COLORS)[number]
  >(PLAYER_COLORS[0]);
  const [lobbyCode, setLobbyCode] = useState("");
  const [mode, setMode] = useState<"create" | "join" | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onCreateLobby(username.trim(), selectedColor);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && lobbyCode.trim()) {
      onJoinLobby(
        lobbyCode.trim().toUpperCase(),
        username.trim(),
        selectedColor
      );
    }
  };

  if (mode === null) {
    return (
      <div className="landing">
        <div className="landing-card">
          <h1 className="title">🎮 Multiplayer Mini-Games</h1>
          <p className="subtitle">Choose your game mode</p>

          <div className="mode-buttons">
            <button
              className="mode-button create"
              onClick={() => setMode("create")}
            >
              🎯 Create Lobby
            </button>
            <button
              className="mode-button join"
              onClick={() => setMode("join")}
            >
              🔑 Join with Code
            </button>
            <button className="mode-button browse" onClick={onBrowseLobbies}>
              🌐 Browse Public Lobbies
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing">
      <div className="landing-card">
        <button className="back-button" onClick={() => setMode(null)}>
          ← Back
        </button>

        <h1 className="title">
          {mode === "create" ? "🎮 Create Lobby" : "🚪 Join Lobby"}
        </h1>

        <form onSubmit={mode === "create" ? handleCreate : handleJoin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={20}
              required
            />
          </div>

          {mode === "join" && (
            <div className="form-group">
              <label htmlFor="code">Lobby Code</label>
              <input
                id="code"
                type="text"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                placeholder="Enter lobby code"
                maxLength={6}
                required
              />
            </div>
          )}

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

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button">
            {mode === "create" ? "Create Lobby" : "Join Lobby"}
          </button>
        </form>
      </div>
    </div>
  );
}
