import { useState } from "react";
import type { GameAction } from "shared/types";
import { SkipButton } from "../../components/SkipButton";
import { useTranslation } from "../../i18n/I18nContext";
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

export function NumberGuessing({
  gameState,
  onAction,
  playerId,
}: NumberGuessingProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const state = gameState as NumberGuessingState | null;

  const min = state?.minNumber ?? 1;
  const max = state?.maxNumber ?? 100;
  const myGuesses =
    state?.guesses?.filter((entry) => entry.playerId === playerId) ?? [];
  const lastHint = myGuesses.at(-1)?.hint;

  const hintLabel = (hint: GuessHint) => {
    switch (hint) {
      case "higher":
        return t("games.number_guessing.hintHigher");
      case "lower":
        return t("games.number_guessing.hintLower");
      case "correct":
        return t("games.number_guessing.hintCorrect");
    }
  };

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
        <div className="ng-loading">{t("games.number_guessing.loading")}</div>
      </div>
    );
  }

  return (
    <div className="ng-container">
      <div className="ng-content">
        <h1 className="ng-title">{t("games.number_guessing.title")}</h1>
        <p className="ng-subtitle">
          {t("games.number_guessing.subtitle", { min, max })}
        </p>

        {state.status === "guessing" && (
          <>
            <div className="ng-range-badge">
              {t("common.range", { min, max })}
            </div>

            {lastHint && lastHint !== "correct" && (
              <div
                className={`ng-hint-banner ${lastHint === "higher" ? "higher" : "lower"}`}
              >
                {lastHint === "higher"
                  ? t("games.number_guessing.tryHigher")
                  : t("games.number_guessing.tryLower")}
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
                {t("games.number_guessing.guess")}
              </button>
            </form>

            {state.roundCountdown !== undefined && (
              <p className="ng-timer">
                {t("common.secondsRemaining", {
                  count: state.roundCountdown,
                })}
              </p>
            )}

            {myGuesses.length > 0 && (
              <div className="ng-history">
                <h3 className="ng-history-title">
                  {t("games.number_guessing.yourGuesses")}
                </h3>
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
              <h2 className="ng-results-title">
                {t("games.number_guessing.roundOver")}
              </h2>

              <div className="ng-secret-reveal">
                <span className="ng-secret-label">
                  {t("games.number_guessing.secretNumber")}
                </span>
                <span className="ng-secret-value">{state.secretNumber}</span>
              </div>

              {state.winnerPlayerId && !state.noWinner ? (
                <p className="ng-winner-message">
                  {t("games.number_guessing.winnerMessage")}
                </p>
              ) : (
                <p className="ng-no-winner-message">
                  {t("games.number_guessing.timeoutMessage")}
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
