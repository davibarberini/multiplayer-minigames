import { useState } from "react";
import type { GameAction } from "../../../shared/types";
import { SkipButton } from "../../components/SkipButton";
import "./styles.css";

type GuessHint = "higher" | "lower" | "correct";

interface GuessEntry {
  playerId: string;
  guess: number;
  hint: GuessHint;
}

interface NumberGuessingState {
  status: string;
  minNumber?: number;
  maxNumber?: number;
  roundCountdown?: number;
  guesses?: GuessEntry[];
  secretNumber?: number | null;
  winnerPlayerId?: string | null;
  noWinner?: boolean;
}

interface NumberGuessingProps {
  gameState: unknown;
  onAction: (action: GameAction) => void;
  playerId: string;
}

function hintLabel(hint: GuessHint): string {
  switch (hint) {
    case "higher":
      return "Higher ↑";
    case "lower":
      return "Lower ↓";
    case "correct":
      return "Correct! ✓";
  }
}

export function NumberGuessing({
  gameState,
  onAction,
  playerId,
}: NumberGuessingProps) {
  const [inputValue, setInputValue] = useState("");
  const state = gameState as NumberGuessingState | null;

  const min = state?.minNumber ?? 1;
  const max = state?.maxNumber ?? 100;
  const myGuesses =
    state?.guesses?.filter((entry) => entry.playerId === playerId) ?? [];
  const lastHint = myGuesses.at(-1)?.hint;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (state?.status !== "guessing") return;

    const guess = parseInt(inputValue, 10);
    if (Number.isNaN(guess) || guess < min || guess > max) return;

    onAction({ type: "guess", payload: guess });
    setInputValue("");
  };

  const handleSkip = () => {
    onAction({ type: "skip" });
  };

  if (!state) {
    return (
      <div className="ng-container">
        <div className="ng-loading">Loading round...</div>
      </div>
    );
  }

  return (
    <div className="ng-container">
      <div className="ng-content">
        <h1 className="ng-title">Number Guessing</h1>
        <p className="ng-subtitle">
          Guess the secret number between {min} and {max}
        </p>

        {state.status === "guessing" && (
          <>
            <div className="ng-range-badge">
              Range: {min}–{max}
            </div>

            {lastHint && lastHint !== "correct" && (
              <div
                className={`ng-hint-banner ${lastHint === "higher" ? "higher" : "lower"}`}
              >
                Try {lastHint === "higher" ? "higher" : "lower"}!
              </div>
            )}

            <form className="ng-form" onSubmit={handleSubmit}>
              <input
                type="number"
                className="ng-input"
                min={min}
                max={max}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`${min}–${max}`}
                autoFocus
              />
              <button type="submit" className="ng-submit-btn">
                Guess
              </button>
            </form>

            {state.roundCountdown !== undefined && (
              <p className="ng-timer">{state.roundCountdown}s remaining</p>
            )}

            {myGuesses.length > 0 && (
              <div className="ng-history">
                <h3 className="ng-history-title">Your guesses</h3>
                <ul className="ng-history-list">
                  {myGuesses.map((entry, index) => (
                    <li key={index} className="ng-history-item">
                      <span className="ng-history-guess">{entry.guess}</span>
                      <span className={`ng-history-hint ${entry.hint}`}>
                        {hintLabel(entry.hint)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {(state.status === "results" || state.status === "ended") &&
          state.secretNumber !== null &&
          state.secretNumber !== undefined && (
            <div className="ng-results">
              <h2 className="ng-results-title">Round over</h2>

              <div className="ng-secret-reveal">
                <span className="ng-secret-label">Secret number</span>
                <span className="ng-secret-value">{state.secretNumber}</span>
              </div>

              {state.winnerPlayerId && !state.noWinner ? (
                <p className="ng-winner-message">
                  🎉 Someone guessed it correctly and wins the round!
                </p>
              ) : (
                <p className="ng-no-winner-message">
                  ⏱️ Time ran out — nobody guessed the number this round.
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
