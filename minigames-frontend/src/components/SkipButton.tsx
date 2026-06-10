import "./SkipButton.css";

interface SkipButtonProps {
  onSkip: () => void;
  disabled?: boolean;
  label?: string;
}

export function SkipButton({
  onSkip,
  disabled = false,
  label = "Pular",
}: SkipButtonProps) {
  return (
    <button
      type="button"
      className="skip-button"
      onClick={onSkip}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
