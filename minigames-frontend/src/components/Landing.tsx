import { useState } from "react";
import { PLAYER_COLORS } from "shared/constants";
import { useTranslation } from "../i18n/I18nContext";
import { LanguagePicker } from "./LanguagePicker";
import "./Landing.css";

interface LandingProps {
  onCreateLobby: (username: string, color: string) => void;
  onJoinLobby: (code: string, username: string, color: string) => void;
  onBrowseLobbies: () => void;
  error: { code?: string; message?: string } | null;
}

export function Landing({
  onCreateLobby,
  onJoinLobby,
  onBrowseLobbies,
  error,
}: LandingProps) {
  const { t, locale } = useTranslation();
  const [username, setUsername] = useState("");
  const [selectedColor, setSelectedColor] = useState<
    (typeof PLAYER_COLORS)[number]
  >(PLAYER_COLORS[0]);
  const [lobbyCode, setLobbyCode] = useState("");
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const errorMessage = error
    ? error.code
      ? t(`errors.${error.code}`)
      : error.message
    : null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onCreateLobby(username.trim(), selectedColor);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && lobbyCode.trim()) {
      onJoinLobby(
        lobbyCode.trim().toUpperCase(),
        username.trim(),
        selectedColor
      );
    }
  };

  if (showLanguagePicker) {
    return (
      <LanguagePicker onSelect={() => setShowLanguagePicker(false)} />
    );
  }

  if (mode === null) {
    return (
      <div className="landing">
        <div className="landing-card">
          <h1 className="title">{t("landing.title")}</h1>
          <p className="subtitle">{t("landing.subtitle")}</p>

          <div className="mode-buttons">
            <button
              className="mode-button create"
              onClick={() => setMode("create")}
            >
              {t("landing.createLobby")}
            </button>
            <button
              className="mode-button join"
              onClick={() => setMode("join")}
            >
              {t("landing.joinWithCode")}
            </button>
            <button className="mode-button browse" onClick={onBrowseLobbies}>
              {t("landing.browseLobbies")}
            </button>
          </div>

          <button
            type="button"
            className="language-link"
            onClick={() => setShowLanguagePicker(true)}
          >
            {t("landing.changeLanguage")} ({locale})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing">
      <div className="landing-card">
        <button className="back-button" onClick={() => setMode(null)}>
          {t("common.back")}
        </button>

        <h1 className="title">
          {mode === "create" ? t("landing.createTitle") : t("landing.joinTitle")}
        </h1>

        <form onSubmit={mode === "create" ? handleCreate : handleJoin}>
          <div className="form-group">
            <label htmlFor="username">{t("landing.username")}</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("landing.usernamePlaceholder")}
              maxLength={20}
              required
            />
          </div>

          {mode === "join" && (
            <div className="form-group">
              <label htmlFor="code">{t("landing.lobbyCode")}</label>
              <input
                id="code"
                type="text"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                placeholder={t("landing.lobbyCodePlaceholder")}
                maxLength={6}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>{t("landing.chooseColor")}</label>
            <div className="color-picker">
              {PLAYER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${
                    selectedColor === color ? "selected" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  aria-label={t("common.selectColor", { color })}
                />
              ))}
            </div>
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <button type="submit" className="submit-button">
            {mode === "create"
              ? t("landing.submitCreate")
              : t("landing.submitJoin")}
          </button>
        </form>
      </div>
    </div>
  );
}
