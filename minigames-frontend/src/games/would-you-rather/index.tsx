import { useState, useEffect } from "react";
import type { GameAction } from "../../../shared/types";
import "./styles.css";

interface WouldYouRatherState {
  status: string;
  question?: { optionA: string; optionB: string };
  votes?: Array<[string, "A" | "B"]>;
  voteCountdown?: number;
  results?: {
    optionA: number;
    optionB: number;
    winners: string[];
  };
  totalPlayers?: number;
  votedPlayers?: number;
}

interface WouldYouRatherProps {
  gameState: unknown;
  onAction: (action: GameAction) => void;
}

export function WouldYouRather({
  gameState,
  onAction,
}: WouldYouRatherProps) {
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);
  const state = gameState as WouldYouRatherState | null;

  // Get current player ID from socket (we'll need to pass this as prop or get from context)
  // For now, we'll track locally
  useEffect(() => {
    // Reset selection when new question appears
    if (state?.status === "voting" && state?.question) {
      // Check if we already voted in this round
      const currentVote = state.votes?.find(
        ([playerId]) => playerId === "current"
      );
      if (currentVote) {
        setSelectedOption(currentVote[1]);
      } else {
        setSelectedOption(null);
      }
    }
  }, [state?.question, state?.status]);

  const handleVote = (option: "A" | "B") => {
    if (state?.status !== "voting") return;
    setSelectedOption(option);
    onAction({ type: "vote", payload: option });
  };

  const hasVoted = selectedOption !== null;

  if (!state || !state.question) {
    return (
      <div className="wyr-container">
        <div className="wyr-loading">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="wyr-container">
      <div className="wyr-content">
        <h1 className="wyr-title">Would You Rather?</h1>

        {state.status === "voting" && (
          <>
            <div className="wyr-question-container">
              <button
                className={`wyr-option ${selectedOption === "A" ? "selected" : ""}`}
                onClick={() => handleVote("A")}
                disabled={hasVoted}
              >
                <div className="wyr-option-letter">A</div>
                <div className="wyr-option-text">{state.question.optionA}</div>
              </button>

              <div className="wyr-divider">
                <span>OR</span>
              </div>

              <button
                className={`wyr-option ${selectedOption === "B" ? "selected" : ""}`}
                onClick={() => handleVote("B")}
                disabled={hasVoted}
              >
                <div className="wyr-option-letter">B</div>
                <div className="wyr-option-text">{state.question.optionB}</div>
              </button>
            </div>

            <div className="wyr-footer">
              {hasVoted ? (
                <p className="wyr-voted">✓ Vote recorded! Waiting for others...</p>
              ) : (
                <p className="wyr-hint">Click an option to vote</p>
              )}
              <div className="wyr-countdown">
                {state.voteCountdown !== undefined && (
                  <span className="wyr-timer">
                    {state.voteCountdown}s remaining
                  </span>
                )}
                {state.votedPlayers !== undefined &&
                  state.totalPlayers !== undefined && (
                    <span className="wyr-progress">
                      {state.votedPlayers}/{state.totalPlayers} voted
                    </span>
                  )}
              </div>
            </div>
          </>
        )}

        {state.status === "results" && state.results && (
          <div className="wyr-results">
            <h2 className="wyr-results-title">Results</h2>

            <div className="wyr-results-container">
              <div className="wyr-result-option">
                <div className="wyr-result-header">
                  <span className="wyr-result-letter">A</span>
                  <span className="wyr-result-text">{state.question.optionA}</span>
                </div>
                <div className="wyr-result-bar">
                  <div
                    className="wyr-result-fill option-a"
                    style={{
                      width: `${
                        (state.results.optionA /
                          (state.results.optionA + state.results.optionB)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="wyr-result-count">
                  {state.results.optionA} vote
                  {state.results.optionA !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="wyr-result-option">
                <div className="wyr-result-header">
                  <span className="wyr-result-letter">B</span>
                  <span className="wyr-result-text">{state.question.optionB}</span>
                </div>
                <div className="wyr-result-bar">
                  <div
                    className="wyr-result-fill option-b"
                    style={{
                      width: `${
                        (state.results.optionB /
                          (state.results.optionA + state.results.optionB)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="wyr-result-count">
                  {state.results.optionB} vote
                  {state.results.optionB !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {state.results.winners.length > 0 ? (
              <p className="wyr-winner-message">
                🎉 Option {state.results.optionA > state.results.optionB ? "A" : "B"}{" "}
                wins! Winners get 1 point.
              </p>
            ) : (
              <p className="wyr-tie-message">🤝 It's a tie! No winners this round.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

