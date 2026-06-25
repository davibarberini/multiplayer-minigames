import { useTranslation } from "../i18n/I18nContext";
import "./GameTile.css";

interface GameTileProps {
  titleKey: string;
  descriptionKey: string;
  image: string;
  index: number;
  onClick: () => void;
}

export function GameTile({
  titleKey,
  descriptionKey,
  image,
  index,
  onClick,
}: GameTileProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="game-tile"
      style={{ animationDelay: `${index * 0.12}s` }}
      onClick={onClick}
    >
      <div className="game-tile__block">
        <div className="game-tile__face game-tile__face--top" />
        <div className="game-tile__face game-tile__face--front">
          <img
            className="game-tile__image"
            src={image}
            alt={t(titleKey)}
            draggable={false}
          />
          <div className="game-tile__overlay">
            <span className="game-tile__title">{t(titleKey)}</span>
            <span className="game-tile__description">{t(descriptionKey)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
