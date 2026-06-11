import { useState, useEffect } from "react";
import type { GameAction } from "shared/types";
import { getWyrQuestion } from "shared/i18n";
import { SkipButton } from "../../components/SkipButton";
import { useTranslation } from "../../i18n/I18nContext";
import "./styles.css";

interface WouldYouRatherState {
  status: string;
  questionKey?: string | null;
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
  const { t, locale } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);
  const state = gameState as WouldYouRatherState | null;

  useEffect(() => {
    if (state?.status === "voting" && state?.questionKey) {
      setSelectedOption(null);
    }
  }, [state?.questionKey, state?.status]);

  const handleVote = (option: "A" | "B") => {
    if (state?.status !== "voting") return;
    setSelectedOption(option);
    onAction({ type: "vote", payload: option });
  };

  const handleSkip = () => {
    onAction({ type: "skip" });
  };

  const hasVoted = selectedOption !== null;

  if (!state || !state.questionKey || !locale) {
    return (
      <div className="wyr-container">
        <div className="wyr-loading">{t("games.would_you_rather.loading")}</div>
      </div>
    );
  }

  const question = getWyrQuestion(locale, state.questionKey);

  return (
    <div className="wyr-container">
      <div className="wyr-content">
        <h1 className="wyr-title">{t("games.would_you_rather.title")}</h1>

        {state.status === "voting" && (
          <>
            <div className="wyr-question-container">
              <button
                className={`wyr-option ${selectedOption === "A" ? "selected" : ""}`}
                onClick={() => handleVote("A")}
                disabled={hasVoted}
              >
                <div className="wyr-option-letter">A</div>
                <div className="wyr-option-text">{question.optionA}</div>
              </button>

              <div className="wyr-divider">
                <span>{t("common.or")}</span>
              </div>

              <button
                className={`wyr-option ${selectedOption === "B" ? "selected" : ""}`}
                onClick={() => handleVote("B")}
                disabled={hasVoted}
              >
                <div className="wyr-option-letter">B</div>
                <div className="wyr-option-text">{question.optionB}</div>
              </button>
            </div>

            <div className="wyr-footer">
              {hasVoted ? (
                <p className="wyr-voted">{t("common.voteRecorded")}</p>
              ) : (
                <p className="wyr-hint">
                  {t("games.would_you_rather.clickToVote")}
                </p>
              )}
              <div className="wyr-countdown">
                {state.voteCountdown !== undefined && (
                  <span className="wyr-timer">
                    {t("common.secondsRemaining", {
                      count: state.voteCountdown,
                    })}
                  </span>
                )}
                {state.votedPlayers !== undefined &&
                  state.totalPlayers !== undefined && (
                    <span className="wyr-progress">
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

        {state.status === "results" && state.results && (
          <div className="wyr-results">
            <h2 className="wyr-results-title">
              {t("games.would_you_rather.results")}
            </h2>

            <div className="wyr-results-container">
              <div className="wyr-result-option">
                <div className="wyr-result-header">
                  <span className="wyr-result-letter">A</span>
                  <span className="wyr-result-text">{question.optionA}</span>
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
                  {t("games.would_you_rather.voteCount", {
                    count: state.results.optionA,
                    voteLabel:
                      state.results.optionA === 1
                        ? t("common.vote")
                        : t("common.votes"),
                  })}
                </div>
              </div>

              <div className="wyr-result-option">
                <div className="wyr-result-header">
                  <span className="wyr-result-letter">B</span>
                  <span className="wyr-result-text">{question.optionB}</span>
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
                  {t("games.would_you_rather.voteCount", {
                    count: state.results.optionB,
                    voteLabel:
                      state.results.optionB === 1
                        ? t("common.vote")
                        : t("common.votes"),
                  })}
                </div>
              </div>
            </div>

            {state.results.winners.length > 0 ? (
              <p className="wyr-winner-message">
                {t("games.would_you_rather.winnerMessage", {
                  option:
                    state.results.optionA > state.results.optionB ? "A" : "B",
                })}
              </p>
            ) : (
              <p className="wyr-tie-message">
                {t("games.would_you_rather.tieMessage")}
              </p>
            )}

            <SkipButton onSkip={handleSkip} />
          </div>
        )}
      </div>
    </div>
  );
}
