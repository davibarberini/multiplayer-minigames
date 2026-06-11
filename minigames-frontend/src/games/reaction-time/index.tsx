import { useState, useEffect } from "react";
import type { GameAction } from "shared/types";
import { SkipButton } from "../../components/SkipButton";
import { useTranslation } from "../../i18n/I18nContext";
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
  const { t } = useTranslation();
  const [clicked, setClicked] = useState(false);
  const state = gameState as ReactionTimeState | null;

  useEffect(() => {
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
    if (!state) return t("games.reaction_time.loading");

    switch (state.status) {
      case "ready":
        return clicked
          ? t("games.reaction_time.tooEarly")
          : t("games.reaction_time.waitForGreen");
      case "green":
        return clicked
          ? t("games.reaction_time.clicked")
          : t("games.reaction_time.clickNow");
      case "ended":
        return t("games.reaction_time.roundEnded");
      default:
        return t("games.reaction_time.getReady");
    }
  };

  const remaining = state?.playersRemaining ?? 0;

  return (
    <div
      className="reaction-game"
      style={{ backgroundColor: getBackgroundColor() }}
      onClick={handleClick}
    >
      <div className="reaction-content">
        <h1 className="reaction-message">{getMessage()}</h1>

        {state?.status === "ready" && !clicked && (
          <p className="reaction-hint">{t("games.reaction_time.hint")}</p>
        )}

        {remaining > 0 && (
          <p className="players-remaining">
            {t("games.reaction_time.waitingForPlayers", {
              count: remaining,
              playerLabel:
                remaining > 1 ? t("common.players") : t("common.player"),
            })}
          </p>
        )}

        {clicked && state?.status !== "ended" && (
          <p className="click-feedback">
            {t("games.reaction_time.responseRecorded")}
          </p>
        )}

        {clicked && state?.status === "green" && (
          <SkipButton onSkip={() => onAction({ type: "skip" })} />
        )}
      </div>
    </div>
  );
}
