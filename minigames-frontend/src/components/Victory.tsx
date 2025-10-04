import type { Player } from "../../../shared/types";
import "./Victory.css";

interface VictoryProps {
  winner: Player;
  players: Player[];
  onReturnToLobby: () => void;
}

export function Victory({ winner, players, onReturnToLobby }: VictoryProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="victory-overlay">
      <div className="victory-card">
        <div className="confetti">🎉</div>

        <h1 className="victory-title">Game Over!</h1>

        <div className="champion-section">
          <div className="champion-trophy">🏆</div>
          <div
            className="champion-color"
            style={{ backgroundColor: winner.color }}
          />
          <h2 className="champion-name">{winner.username}</h2>
          <p className="champion-label">is the Champion!</p>
          <div className="champion-score">{winner.score} points</div>
        </div>

        <div className="final-standings">
          <h3>Final Standings</h3>
          <div className="standings-list">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`standing-item ${index === 0 ? "first-place" : ""}`}
              >
                <span className="standing-rank">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && `#${index + 1}`}
                </span>
                <div
                  className="standing-color"
                  style={{ backgroundColor: player.color }}
                />
                <span className="standing-name">{player.username}</span>
                <span className="standing-score">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="return-button" onClick={onReturnToLobby}>
          Return to Lobby
        </button>

        <p className="rematch-hint">Ready for a rematch? 🎮</p>
      </div>
    </div>
  );
}
