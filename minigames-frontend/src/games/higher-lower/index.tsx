import { useState, useEffect } from "react";
import type { GameAction } from "shared/types";
import { SkipButton } from "../../components/SkipButton";
import { useTranslation } from "../../i18n/I18nContext";
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
  const { t } = useTranslation();
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
        <div className="hl-loading">{t("games.higher_lower.loading")}</div>
      </div>
    );
  }

  return (
    <div className="hl-container">
      <div className="hl-content">
        <h1 className="hl-title">{t("games.higher_lower.title")}</h1>
        <p className="hl-subtitle">{t("games.higher_lower.subtitle")}</p>

        <div className="hl-number-display">
          <span className="hl-number-label">
            {t("games.higher_lower.currentNumber")}
          </span>
          <span className="hl-number-value">{state.currentNumber}</span>
          {state.minNumber !== undefined && state.maxNumber !== undefined && (
            <span className="hl-number-range">
              {t("common.range", {
                min: state.minNumber,
                max: state.maxNumber,
              })}
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
                <span className="hl-vote-label">
                  {t("games.higher_lower.higher")}
                </span>
              </button>

              <button
                className={`hl-vote-btn lower ${selectedChoice === "lower" ? "selected" : ""}`}
                onClick={() => handleVote("lower")}
                disabled={hasVoted}
              >
                <span className="hl-vote-icon">↓</span>
                <span className="hl-vote-label">
                  {t("games.higher_lower.lower")}
                </span>
              </button>
            </div>

            <div className="hl-footer">
              {hasVoted ? (
                <p className="hl-voted">{t("common.voteRecorded")}</p>
              ) : (
                <p className="hl-hint">{t("games.higher_lower.pickHint")}</p>
              )}
              <div className="hl-countdown">
                {state.voteCountdown !== undefined && (
                  <span className="hl-timer">
                    {t("common.secondsRemaining", {
                      count: state.voteCountdown,
                    })}
                  </span>
                )}
                {state.votedPlayers !== undefined &&
                  state.totalPlayers !== undefined && (
                    <span className="hl-progress">
                      {t("common.voted", {
                        voted: state.votedPlayers,
                        total: state.totalPlayers,
                      })}
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
              <h2 className="hl-results-title">
                {t("games.higher_lower.reveal")}
              </h2>

              <div className="hl-reveal-numbers">
                <div className="hl-reveal-card">
                  <span className="hl-reveal-label">
                    {t("games.higher_lower.was")}
                  </span>
                  <span className="hl-reveal-value">{state.currentNumber}</span>
                </div>
                <span className="hl-reveal-arrow">→</span>
                <div className="hl-reveal-card highlight">
                  <span className="hl-reveal-label">
                    {t("games.higher_lower.now")}
                  </span>
                  <span className="hl-reveal-value">{state.nextNumber}</span>
                </div>
              </div>

              <p className="hl-direction-message">
                {t("games.higher_lower.numberWent")}{" "}
                <strong>
                  {state.results.actualDirection === "higher"
                    ? t("games.higher_lower.directionUp")
                    : t("games.higher_lower.directionDown")}
                </strong>
              </p>

              <div className="hl-vote-breakdown">
                <div className="hl-breakdown-item higher">
                  <span>{t("games.higher_lower.higher")}</span>
                  <span>
                    {state.results.higher}{" "}
                    {state.results.higher === 1
                      ? t("common.vote")
                      : t("common.votes")}
                  </span>
                </div>
                <div className="hl-breakdown-item lower">
                  <span>{t("games.higher_lower.lower")}</span>
                  <span>
                    {state.results.lower}{" "}
                    {state.results.lower === 1
                      ? t("common.vote")
                      : t("common.votes")}
                  </span>
                </div>
              </div>

              {state.results.winners.length > 0 ? (
                <p className="hl-winner-message">
                  {t("games.higher_lower.winnerMessage")}
                </p>
              ) : (
                <p className="hl-no-winner-message">
                  {t("games.higher_lower.noWinnerMessage")}
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
