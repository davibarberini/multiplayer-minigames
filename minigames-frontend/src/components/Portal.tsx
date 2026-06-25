import { useState } from "react";
import { useTranslation } from "../i18n/I18nContext";
import {
  type GameCategory,
  getGamesByCategory,
  type PortalGame,
} from "../games/catalog";
import { GameTile } from "./GameTile";
import { LanguagePicker } from "./LanguagePicker";
import "./Portal.css";

interface PortalProps {
  onPlayMultiplayer: () => void;
}

export function Portal({ onPlayMultiplayer }: PortalProps) {
  const { t, locale } = useTranslation();
  const [tab, setTab] = useState<GameCategory>("singleplayer");
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const games = getGamesByCategory(tab);

  const handleGameClick = (game: PortalGame) => {
    if (game.externalUrl) {
      window.open(game.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (game.internalAction === "multiplayer-marathon") {
      onPlayMultiplayer();
    }
  };

  if (showLanguagePicker) {
    return <LanguagePicker onSelect={() => setShowLanguagePicker(false)} />;
  }

  return (
    <div className="portal">
      <header className="portal__header">
        <h1 className="portal__logo">{t("portal.title")}</h1>

        <nav className="portal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "singleplayer"}
            className={`portal__tab ${tab === "singleplayer" ? "portal__tab--active" : ""}`}
            onClick={() => setTab("singleplayer")}
          >
            {t("portal.tabs.singleplayer")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "multiplayer"}
            className={`portal__tab ${tab === "multiplayer" ? "portal__tab--active" : ""}`}
            onClick={() => setTab("multiplayer")}
          >
            {t("portal.tabs.multiplayer")}
          </button>
        </nav>

        <button
          type="button"
          className="portal__lang"
          onClick={() => setShowLanguagePicker(true)}
          aria-label={t("landing.changeLanguage")}
        >
          {locale}
        </button>
      </header>

      <main className="portal__main">
        <p className="portal__subtitle">{t(`portal.subtitle.${tab}`)}</p>

        <div className="portal__grid">
          {games.map((game, index) => (
            <GameTile
              key={game.id}
              titleKey={game.titleKey}
              descriptionKey={game.descriptionKey}
              image={game.image}
              index={index}
              onClick={() => handleGameClick(game)}
            />
          ))}
        </div>
      </main>

      <footer className="portal__footer">
        <span className="portal__footer-text">{t("portal.footer")}</span>
      </footer>
    </div>
  );
}
