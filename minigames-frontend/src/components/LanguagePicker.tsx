import { useTranslation } from "../i18n/I18nContext";
import type { Locale } from "shared/i18n";
import "./LanguagePicker.css";

interface LanguagePickerProps {
  onSelect?: (locale: Locale) => void;
}

export function LanguagePicker({ onSelect }: LanguagePickerProps) {
  const { setLocale } = useTranslation();

  const handleSelect = (locale: Locale) => {
    setLocale(locale);
    onSelect?.(locale);
  };

  return (
    <div className="language-picker-overlay">
      <div className="language-picker-card">
        <h1 className="language-picker-title">Choose your language</h1>
        <p className="language-picker-subtitle">Escolha seu idioma</p>

        <div className="language-picker-buttons">
          <button
            type="button"
            className="language-picker-btn"
            onClick={() => handleSelect("en")}
          >
            English
          </button>
          <button
            type="button"
            className="language-picker-btn"
            onClick={() => handleSelect("pt-BR")}
          >
            Português (Brasil)
          </button>
        </div>
      </div>
    </div>
  );
}
