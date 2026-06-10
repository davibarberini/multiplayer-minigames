import type {
  RoundResult as RoundResultType,
  Player,
} from "../../../shared/types";
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
  const noWinner = result.stats.noWinner === true;
  const winner = players.find((p) => p.id === result.winnerId);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Type guard for responses
  const responses = result.stats.responses as
    | Record<string, number>
    | undefined;
  const hasResponses = responses && typeof responses === "object";

  return (
    <div className="round-result-overlay">
      <div className="round-result-card">
        <h1 className="result-title">Round Complete!</h1>

        <div className="winner-section">
          {noWinner ? (
            <div className="winner-info">
              <h2 className="winner-name">Nobody wins this round</h2>
              <p className="winner-label">Scores unchanged</p>
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
                  <p className="winner-label">wins this round!</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="round-stats">
          <h3>Round Stats</h3>
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
                      {time === -1 ? "Too early!" : `${time}ms`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="scoreboard">
          <h3>Current Scores</h3>
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
              Next Round
            </button>
            <button className="end-session-button-card" onClick={onEndSession}>
              Back to Lobby
            </button>
          </div>
        )}

        {!isHost && (
          <p className="waiting-text">
            Waiting for host to start next round...
          </p>
        )}
      </div>
    </div>
  );
}
