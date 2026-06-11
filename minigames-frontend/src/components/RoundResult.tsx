import type {
  RoundResult as RoundResultType,
  Player,
} from "shared/types";
import { useTranslation } from "../i18n/I18nContext";
import "./RoundResult.css";

interface RoundResultProps {
  result: RoundResultType;
  players: Player[];
  isHost: boolean;
  onNextRound: () => void;
  onEndSession: () => void;
}

export function RoundResult({
  result,
  players,
  isHost,
  onNextRound,
  onEndSession,
}: RoundResultProps) {
  const { t } = useTranslation();
  const noWinner = result.stats.noWinner === true;
  const winner = players.find((p) => p.id === result.winnerId);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const responses = result.stats.responses as
    | Record<string, number>
    | undefined;
  const hasResponses = responses && typeof responses === "object";

  return (
    <div className="round-result-overlay">
      <div className="round-result-card">
        <h1 className="result-title">{t("roundResult.title")}</h1>

        <div className="winner-section">
          {noWinner ? (
            <div className="winner-info">
              <h2 className="winner-name">{t("roundResult.nobodyWins")}</h2>
              <p className="winner-label">{t("roundResult.scoresUnchanged")}</p>
            </div>
          ) : (
            <>
              <div className="winner-badge">🏆</div>
              {winner && (
                <div className="winner-info">
                  <div
                    className="winner-color"
                    style={{ backgroundColor: winner.color }}
                  />
                  <h2 className="winner-name">{winner.username}</h2>
                  <p className="winner-label">{t("roundResult.winsRound")}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="round-stats">
          <h3>{t("roundResult.roundStats")}</h3>
          {hasResponses && (
            <div className="response-times">
              {Object.entries(responses).map(([playerId, time]) => {
                const player = players.find((p) => p.id === playerId);
                if (!player) return null;

                return (
                  <div key={playerId} className="response-item">
                    <div
                      className="response-color"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="response-name">{player.username}</span>
                    <span className="response-time">
                      {time === -1
                        ? t("roundResult.tooEarly")
                        : t("roundResult.responseMs", { time })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="scoreboard">
          <h3>{t("roundResult.currentScores")}</h3>
          <div className="score-list">
            {sortedPlayers.map((player, index) => (
              <div key={player.id} className="score-item">
                <span className="score-rank">#{index + 1}</span>
                <div
                  className="score-color"
                  style={{ backgroundColor: player.color }}
                />
                <span className="score-name">{player.username}</span>
                <span className="score-value">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="host-round-actions">
            <button className="next-round-button" onClick={onNextRound}>
              {t("roundResult.nextRound")}
            </button>
            <button className="end-session-button-card" onClick={onEndSession}>
              {t("roundResult.backToLobby")}
            </button>
          </div>
        )}

        {!isHost && (
          <p className="waiting-text">{t("roundResult.waitingForHost")}</p>
        )}
      </div>
    </div>
  );
}
