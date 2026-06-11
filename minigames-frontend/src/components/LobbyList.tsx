import { useState } from "react";
import type { Lobby } from "shared/types";
import { PLAYER_COLORS } from "shared/constants";
import { useTranslation } from "../i18n/I18nContext";
import "./LobbyList.css";

interface LobbyListProps {
  lobbies: Lobby[];
  onJoinLobby: (code: string, username: string, color: string) => void;
  onBack: () => void;
}

export function LobbyList({ lobbies, onJoinLobby, onBack }: LobbyListProps) {
  const { t } = useTranslation();
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
            <h2>{t("lobbyList.joinLobbyTitle", { code: selectedLobby })}</h2>
            <form onSubmit={handleJoinSubmit}>
              <div className="form-group">
                <label>{t("landing.username")}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("landing.usernamePlaceholder")}
                  maxLength={20}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>{t("landing.chooseColor")}</label>
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
                      aria-label={t("common.selectColor", { color })}
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
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={!username.trim()}
                >
                  {t("lobbyList.joinGame")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="lobby-list-card">
        <div className="lobby-list-header">
          <h1>{t("lobbyList.title")}</h1>
          <button className="back-button" onClick={onBack}>
            {t("common.back")}
          </button>
        </div>

        {lobbies.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">😔</p>
            <p className="empty-text">{t("lobbyList.emptyText")}</p>
            <p className="empty-hint">{t("lobbyList.emptyHint")}</p>
          </div>
        ) : (
          <div className="lobbies-grid">
            {lobbies.map((lobby) => {
              const maxPlayers = lobby.config.maxPlayers || 8;
              const isFull = lobby.players.length >= maxPlayers;
              const gameCount = lobby.config.selectedGames.length;

              return (
                <div key={lobby.code} className="lobby-item">
                  <div className="lobby-item-header">
                    <h3 className="lobby-code">{lobby.code}</h3>
                    <span className="lobby-status">
                      {t("lobbyList.playersCount", {
                        current: lobby.players.length,
                        max: maxPlayers,
                      })}
                    </span>
                  </div>

                  <div className="lobby-item-info">
                    <div className="info-row">
                      <span className="info-label">{t("lobbyList.gameLabel")}</span>
                      <span className="info-value">
                        {gameCount}{" "}
                        {gameCount === 1 ? t("common.game") : t("common.games")}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">
                        {t("lobbyList.pointsToWin")}
                      </span>
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
                    disabled={isFull}
                  >
                    {isFull ? t("lobbyList.full") : t("lobbyList.joinLobby")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
