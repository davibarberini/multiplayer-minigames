import { useState, useEffect } from "react";
import type { GameAction } from "../../../shared/types";
import { SkipButton } from "../../components/SkipButton";
import "./styles.css";

type VoteChoice = "higher" | "lower";

interface HigherLowerResults {
  higher: number;
  lower: number;
  winners: string[];
  actualDirection: VoteChoice;
}

interface HigherLowerState {
  status: string;
  currentNumber?: number | null;
  nextNumber?: number | null;
  votes?: Array<[string, VoteChoice]>;
  voteCountdown?: number;
  results?: HigherLowerResults;
  totalPlayers?: number;
  votedPlayers?: number;
  minNumber?: number;
  maxNumber?: number;
}

interface HigherLowerProps {
  gameState: unknown;
  onAction: (action: GameAction) => void;
}

export function HigherLower({ gameState, onAction }: HigherLowerProps) {
  const [selectedChoice, setSelectedChoice] = useState<VoteChoice | null>(null);
  const state = gameState as HigherLowerState | null;

  useEffect(() => {
    if (state?.status === "voting") {
      setSelectedChoice(null);
    }
  }, [state?.currentNumber, state?.status]);

  const handleVote = (choice: VoteChoice) => {
    if (state?.status !== "voting") return;
    setSelectedChoice(choice);
    onAction({ type: "vote", payload: choice });
  };

  const handleSkip = () => {
    onAction({ type: "skip" });
  };

  const hasVoted = selectedChoice !== null;

  if (!state || state.currentNumber === null || state.currentNumber === undefined) {
    return (
      <div className="hl-container">
        <div className="hl-loading">Loading round...</div>
      </div>
    );
  }

  return (
    <div className="hl-container">
      <div className="hl-content">
        <h1 className="hl-title">Higher or Lower</h1>
        <p className="hl-subtitle">
          Will the next number be higher or lower than the current one?
        </p>

        <div className="hl-number-display">
          <span className="hl-number-label">Current number</span>
          <span className="hl-number-value">{state.currentNumber}</span>
          {state.minNumber !== undefined && state.maxNumber !== undefined && (
            <span className="hl-number-range">
              Range: {state.minNumber}–{state.maxNumber}
            </span>
          )}
        </div>

        {state.status === "voting" && (
          <>
            <div className="hl-vote-container">
              <button
                className={`hl-vote-btn higher ${selectedChoice === "higher" ? "selected" : ""}`}
                onClick={() => handleVote("higher")}
                disabled={hasVoted}
              >
                <span className="hl-vote-icon">↑</span>
                <span className="hl-vote-label">Higher</span>
              </button>

              <button
                className={`hl-vote-btn lower ${selectedChoice === "lower" ? "selected" : ""}`}
                onClick={() => handleVote("lower")}
                disabled={hasVoted}
              >
                <span className="hl-vote-icon">↓</span>
                <span className="hl-vote-label">Lower</span>
              </button>
            </div>

            <div className="hl-footer">
              {hasVoted ? (
                <p className="hl-voted">✓ Vote recorded! Waiting for others...</p>
              ) : (
                <p className="hl-hint">Pick higher or lower before time runs out</p>
              )}
              <div className="hl-countdown">
                {state.voteCountdown !== undefined && (
                  <span className="hl-timer">{state.voteCountdown}s remaining</span>
                )}
                {state.votedPlayers !== undefined &&
                  state.totalPlayers !== undefined && (
                    <span className="hl-progress">
                      {state.votedPlayers}/{state.totalPlayers} voted
                    </span>
                  )}
              </div>
            </div>
          </>
        )}

        {(state.status === "results" || state.status === "ended") &&
          state.results &&
          state.nextNumber !== null &&
          state.nextNumber !== undefined && (
            <div className="hl-results">
              <h2 className="hl-results-title">Reveal</h2>

              <div className="hl-reveal-numbers">
                <div className="hl-reveal-card">
                  <span className="hl-reveal-label">Was</span>
                  <span className="hl-reveal-value">{state.currentNumber}</span>
                </div>
                <span className="hl-reveal-arrow">→</span>
                <div className="hl-reveal-card highlight">
                  <span className="hl-reveal-label">Now</span>
                  <span className="hl-reveal-value">{state.nextNumber}</span>
                </div>
              </div>

              <p className="hl-direction-message">
                The number went{" "}
                <strong>{state.results.actualDirection === "higher" ? "UP ↑" : "DOWN ↓"}</strong>
              </p>

              <div className="hl-vote-breakdown">
                <div className="hl-breakdown-item higher">
                  <span>Higher</span>
                  <span>{state.results.higher} vote{state.results.higher !== 1 ? "s" : ""}</span>
                </div>
                <div className="hl-breakdown-item lower">
                  <span>Lower</span>
                  <span>{state.results.lower} vote{state.results.lower !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {state.results.winners.length > 0 ? (
                <p className="hl-winner-message">
                  🎉 Correct guessers win 1 point!
                </p>
              ) : (
                <p className="hl-no-winner-message">
                  😅 Nobody guessed correctly this round.
                </p>
              )}

              {state.status === "results" && (
                <SkipButton onSkip={handleSkip} />
              )}
            </div>
          )}
      </div>
    </div>
  );
}
