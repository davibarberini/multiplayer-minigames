import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  t as translate,
  type Locale,
  type TranslationParams,
} from "shared/i18n";
import { I18nContext } from "./I18nContext";
import { getStoredLocale, storeLocale } from "./localeStorage";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredLocale();
    if (stored) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
    }
    setReady(stored !== null);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    storeLocale(next);
    setLocaleState(next);
    document.documentElement.lang = next;
    setReady(true);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      if (!locale) return key;
      return translate(locale, key, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, ready, setLocale, t }),
    [locale, ready, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
