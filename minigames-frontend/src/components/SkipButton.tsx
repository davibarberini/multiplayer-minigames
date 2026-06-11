import { useTranslation } from "../i18n/I18nContext";
import "./SkipButton.css";

interface SkipButtonProps {
  onSkip: () => void;
  disabled?: boolean;
}

export function SkipButton({ onSkip, disabled = false }: SkipButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="skip-button"
      onClick={onSkip}
      disabled={disabled}
    >
      {t("common.skip")}
    </button>
  );
}
