import { useState, useEffect } from "react";
import type { GameAction } from "shared/types";
import { getFtpPrompt } from "shared/i18n";
import { SkipButton } from "../../components/SkipButton";
import { useTranslation } from "../../i18n/I18nContext";
import "./styles.css";

interface DisplayOption {
  displayIndex: number;
  text: string;
}

interface VoteResultEntry {
  playerId: string;
  text: string;
  votes: number;
}

interface FinishThePhraseResults {
  winners: string[];
  entries: VoteResultEntry[];
  noWinner: boolean;
}

interface FinishThePhraseState {
  status: string;
  promptKey?: string;
  displayOptions?: DisplayOption[];
  submissions?: Array<[string, string]>;
  votes?: Array<[string, number]>;
  phaseCountdown?: number;
  results?: FinishThePhraseResults;
  totalPlayers?: number;
  submittedPlayers?: number;
  votedPlayers?: number;
  noWinner?: boolean;
  minPhraseLength?: number;
  maxPhraseLength?: number;
}

interface FinishThePhraseProps {
  gameState: unknown;
  onAction: (action: GameAction) => void;
  playerId: string;
}

export function FinishThePhrase({
  gameState,
  onAction,
  playerId,
}: FinishThePhraseProps) {
  const { t, locale } = useTranslation();
  const [phrase, setPhrase] = useState("");
  const [myPhrase, setMyPhrase] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const state = gameState as FinishThePhraseState | null;

  const hasSubmitted =
    state?.submissions?.some(([id]) => id === playerId) ?? false;
  const hasVoted = state?.votes?.some(([id]) => id === playerId) ?? false;

  useEffect(() => {
    setPhrase("");
    setMyPhrase("");
    setSelectedIndex(null);
  }, [state?.promptKey]);

  useEffect(() => {
    const existing = state?.submissions?.find(([id]) => id === playerId);
    if (existing) {
      setMyPhrase(existing[1]);
      setPhrase(existing[1]);
    }
  }, [state?.submissions, playerId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (state?.status !== "writing" || hasSubmitted) return;

    const trimmed = phrase.trim();
    const minLen = state.minPhraseLength ?? 3;
    const maxLen = state.maxPhraseLength ?? 120;
    if (trimmed.length < minLen || trimmed.length > maxLen) return;

    setMyPhrase(trimmed);
    onAction({ type: "submit", payload: trimmed });
  };

  const handleVote = (displayIndex: number, text: string) => {
    if (state?.status !== "voting" || hasVoted) return;
    if (myPhrase.trim().toLowerCase() === text.trim().toLowerCase()) return;

    setSelectedIndex(displayIndex);
    onAction({ type: "vote", payload: displayIndex });
  };

  const handleSkip = () => {
    onAction({ type: "skip" });
  };

  if (!state?.promptKey || !locale) {
    return (
      <div className="ftp-container">
        <div className="ftp-loading">
          {t("games.finish_the_phrase.loading")}
        </div>
      </div>
    );
  }

  const promptText = getFtpPrompt(locale, state.promptKey);

  return (
    <div className="ftp-container">
      <div className="ftp-content">
        <h1 className="ftp-title">{t("games.finish_the_phrase.title")}</h1>

        <div className="ftp-prompt-card">
          <span className="ftp-prompt-label">
            {t("games.finish_the_phrase.completeThis")}
          </span>
          <p className="ftp-prompt-text">{promptText}</p>
        </div>

        {state.status === "writing" && (
          <>
            <form className="ftp-form" onSubmit={handleSubmit}>
              <textarea
                className="ftp-textarea"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder={t("games.finish_the_phrase.placeholder")}
                maxLength={state.maxPhraseLength ?? 120}
                disabled={hasSubmitted}
                rows={3}
              />
              <button
                type="submit"
                className="ftp-submit-btn"
                disabled={hasSubmitted}
              >
                {hasSubmitted
                  ? t("games.finish_the_phrase.submitted")
                  : t("games.finish_the_phrase.submit")}
              </button>
            </form>

            <div className="ftp-footer">
              {hasSubmitted ? (
                <p className="ftp-status">{t("common.waitingForOthers")}</p>
              ) : (
                <p className="ftp-hint">
                  {t("games.finish_the_phrase.creativeHint")}
                </p>
              )}
              <div className="ftp-meta">
                {state.phaseCountdown !== undefined && (
                  <span className="ftp-timer">
                    {t("common.secondsLeft", {
                      count: state.phaseCountdown,
                    })}
                  </span>
                )}
                {state.submittedPlayers !== undefined &&
                  state.totalPlayers !== undefined && (
                    <span className="ftp-progress">
                      {t("common.submitted", {
                        submitted: state.submittedPlayers,
                        total: state.totalPlayers,
                      })}
                    </span>
                  )}
              </div>
            </div>
          </>
        )}

        {state.status === "voting" && state.displayOptions && (
          <>
            <p className="ftp-vote-instruction">
              {t("games.finish_the_phrase.voteInstruction")}
            </p>

            <div className="ftp-options">
              {state.displayOptions.map((option) => {
                const isOwn =
                  myPhrase.trim().toLowerCase() ===
                  option.text.trim().toLowerCase();
                const isSelected = selectedIndex === option.displayIndex;

                return (
                  <button
                    key={option.displayIndex}
                    type="button"
                    className={`ftp-option ${isSelected ? "selected" : ""} ${isOwn ? "own" : ""}`}
                    onClick={() =>
                      handleVote(option.displayIndex, option.text)
                    }
                    disabled={hasVoted || isOwn}
                  >
                    <span className="ftp-option-letter">
                      {String.fromCharCode(65 + option.displayIndex)}
                    </span>
                    <span className="ftp-option-text">{option.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="ftp-footer">
              {hasVoted ? (
                <p className="ftp-status">{t("common.voteRecorded")}</p>
              ) : (
                <p className="ftp-hint">
                  {t("games.finish_the_phrase.pickFunniest")}
                </p>
              )}
              <div className="ftp-meta">
                {state.phaseCountdown !== undefined && (
                  <span className="ftp-timer">
                    {t("common.secondsLeft", {
                      count: state.phaseCountdown,
                    })}
                  </span>
                )}
                {state.votedPlayers !== undefined &&
                  state.totalPlayers !== undefined && (
                    <span className="ftp-progress">
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
          state.results && (
            <div className="ftp-results">
              <h2 className="ftp-results-title">
                {t("games.finish_the_phrase.resultsTitle")}
              </h2>

              <div className="ftp-results-list">
                {state.results.entries.map((entry) => {
                  const isWinner = state.results?.winners.includes(
                    entry.playerId
                  );
                  return (
                    <div
                      key={entry.playerId}
                      className={`ftp-result-item ${isWinner ? "winner" : ""}`}
                    >
                      <p className="ftp-result-text">"{entry.text}"</p>
                      <span className="ftp-result-votes">
                        {t("games.finish_the_phrase.voteCount", {
                          count: entry.votes,
                          voteLabel:
                            entry.votes === 1
                              ? t("common.vote")
                              : t("common.votes"),
                        })}
                        {isWinner && " 🏆"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {state.results.noWinner || state.results.winners.length === 0 ? (
                <p className="ftp-no-winner">
                  {t("games.finish_the_phrase.noWinner")}
                </p>
              ) : (
                <p className="ftp-winner-msg">
                  {t("games.finish_the_phrase.winnerMessage")}
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
