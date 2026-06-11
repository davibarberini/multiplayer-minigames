import { createContext, useContext } from "react";
import type { Locale, TranslationParams } from "shared/i18n";

export interface I18nContextValue {
  locale: Locale | null;
  ready: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslationParams) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return context;
}
