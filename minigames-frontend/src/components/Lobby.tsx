import type { Lobby as LobbyType, MiniGameConfig } from "shared/types";
import { getGameMeta } from "shared/i18n";
import { useTranslation } from "../i18n/I18nContext";
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

export function Lobby({
  lobby,
  currentPlayerId,
  availableGames,
  onStartGame,
  onLeaveLobby,
  onTogglePrivacy,
  onUpdateSelectedGames,
}: LobbyProps) {
  const { t, locale } = useTranslation();
  const activeLocale = locale ?? "en";
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
    .map((id) => getGameMeta(activeLocale, id).name)
    .join(", ");

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <div className="lobby-header">
          <h1>{t("lobby.title")}</h1>
          <button className="leave-button" onClick={onLeaveLobby}>
            {t("lobby.leave")}
          </button>
        </div>

        <div className="lobby-code-section">
          <label>{t("lobby.lobbyCode")}</label>
          <div className="lobby-code">{lobby.code}</div>
          <p className="lobby-code-hint">{t("lobby.shareCode")}</p>
        </div>

        <div className="lobby-info">
          <div className="info-item">
            <span className="info-label">{t("lobby.pointsToWin")}</span>
            <span className="info-value">{lobby.config.pointsToWin}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t("lobby.gamesInRotation")}</span>
            <span className="info-value">
              {lobby.config.selectedGames.length}
            </span>
          </div>
          {isHost && (
            <div className="info-item privacy-toggle">
              <span className="info-label">
                {lobby.config.isPrivate
                  ? t("lobby.private")
                  : t("lobby.public")}
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
          <h2>{t("lobby.gameRotation")}</h2>
          <p className="games-hint">{t("lobby.rotationHint")}</p>

          {isHost ? (
            <>
              <div className="games-actions">
                <button
                  type="button"
                  className="games-action-btn"
                  onClick={selectAllGames}
                >
                  {t("lobby.selectAll")}
                </button>
              </div>
              <div className="games-list">
                {availableGames.map((game) => {
                  const meta = getGameMeta(activeLocale, game.id);
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
                        <span className="game-option-name">{meta.name}</span>
                        <span className="game-option-desc">
                          {meta.description}
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
          <h2>{t("lobby.players", { count: lobby.players.length })}</h2>
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
                    {player.isHost && ` ${t("common.host")}`}
                    {player.id === currentPlayerId && ` ${t("common.you")}`}
                  </span>
                  <span className="player-score">
                    {t("common.score", { score: player.score })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="host-actions">
            {lobby.players.length < 2 && (
              <p className="warning">{t("lobby.needTwoPlayers")}</p>
            )}
            {lobby.config.selectedGames.length === 0 && (
              <p className="warning">{t("lobby.selectOneGame")}</p>
            )}
            <button
              className="start-button"
              onClick={onStartGame}
              disabled={!canStart}
            >
              {t("lobby.startGame")}
            </button>
          </div>
        )}

        {!isHost && (
          <div className="waiting-message">
            <p>{t("lobby.waitingForHost")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
