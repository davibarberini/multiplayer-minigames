import { useState, useEffect } from "react";
import "./ReactionTime.css";

interface ReactionTimeProps {
  gameState: any;
  onAction: (action: any) => void;
}

export function ReactionTime({ gameState, onAction }: ReactionTimeProps) {
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    // Reset clicked state when game resets
    if (gameState?.status === "ready") {
      setClicked(false);
    }
  }, [gameState?.status]);

  const handleClick = () => {
    if (clicked || gameState?.status === "ended") return;

    setClicked(true);
    onAction({ type: "click" });
  };

  const getBackgroundColor = () => {
    switch (gameState?.status) {
      case "ready":
        return "#f5576c";
      case "green":
        return "#4CAF50";
      case "ended":
        return "#666";
      default:
        return "#888";
    }
  };

  const getMessage = () => {
    if (!gameState) return "Loading...";

    switch (gameState.status) {
      case "ready":
        return clicked ? "Too early! ❌" : "Wait for green...";
      case "green":
        return clicked ? "Clicked! ⚡" : "CLICK NOW! 🎯";
      case "ended":
        return "Round ended! Calculating results...";
      default:
        return "Get ready...";
    }
  };

  return (
    <div
      className="reaction-game"
      style={{ backgroundColor: getBackgroundColor() }}
      onClick={handleClick}
    >
      <div className="reaction-content">
        <h1 className="reaction-message">{getMessage()}</h1>

        {gameState?.status === "ready" && !clicked && (
          <p className="reaction-hint">Click when the screen turns green!</p>
        )}

        {gameState?.playersRemaining !== undefined &&
          gameState.playersRemaining > 0 && (
            <p className="players-remaining">
              Waiting for {gameState.playersRemaining} player
              {gameState.playersRemaining > 1 ? "s" : ""}...
            </p>
          )}

        {clicked && gameState?.status !== "ended" && (
          <p className="click-feedback">✓ Response recorded</p>
        )}
      </div>
    </div>
  );
}
