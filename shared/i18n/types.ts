export type Locale = "en" | "pt-BR";

export const LOCALE_STORAGE_KEY = "minigames-locale";

export const SUPPORTED_LOCALES: Locale[] = ["en", "pt-BR"];

export type TranslationParams = Record<string, string | number>;

export type TranslationTree = {
  [key: string]: string | TranslationTree;
};
