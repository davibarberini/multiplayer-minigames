import { useState, useEffect } from "react";
import type { GameAction } from "../../../shared/types";
import "./styles.css";

interface ReactionTimeState {
  status: string;
  responses?: Array<[string, number]>;
  playersRemaining?: number;
}

interface ReactionTimeProps {
  gameState: unknown;
  onAction: (action: GameAction) => void;
}

export function ReactionTime({ gameState, onAction }: ReactionTimeProps) {
  const [clicked, setClicked] = useState(false);

  // Type guard to check if gameState is ReactionTimeState
  const state = gameState as ReactionTimeState | null;

  useEffect(() => {
    // Reset clicked state when game resets
    if (state?.status === "ready") {
      setClicked(false);
    }
  }, [state?.status]);

  const handleClick = () => {
    if (clicked || state?.status === "ended") return;

    setClicked(true);
    onAction({ type: "click" });
  };

  const getBackgroundColor = () => {
    switch (state?.status) {
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
    if (!state) return "Loading...";

    switch (state.status) {
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

        {state?.status === "ready" && !clicked && (
          <p className="reaction-hint">Click when the screen turns green!</p>
        )}

        {state?.playersRemaining !== undefined &&
          state.playersRemaining > 0 && (
            <p className="players-remaining">
              Waiting for {state.playersRemaining} player
              {state.playersRemaining > 1 ? "s" : ""}...
            </p>
          )}

        {clicked && state?.status !== "ended" && (
          <p className="click-feedback">✓ Response recorded</p>
        )}
      </div>
    </div>
  );
}
