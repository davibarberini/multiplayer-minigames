import { en } from "./en";
import { ptBR } from "./pt-BR";
import type { Locale, TranslationParams, TranslationTree } from "./types";
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from "./types";

export type { Locale, TranslationParams, TranslationTree };
export { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES };
export { FTP_PROMPT_KEYS, WYR_QUESTION_KEYS, GAME_IDS } from "./keys";
export type { FtpPromptKey, WyrQuestionKey, GameId } from "./keys";

const catalogs: Record<Locale, TranslationTree> = {
  en,
  "pt-BR": ptBR,
};

function resolvePath(tree: TranslationTree, key: string): string | undefined {
  const parts = key.split(".");
  let current: string | TranslationTree | undefined = tree;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(
  template: string,
  params?: TranslationParams
): string {
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    return value !== undefined ? String(value) : `{{${name}}}`;
  });
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "pt-BR";
}

export function t(
  locale: Locale,
  key: string,
  params?: TranslationParams
): string {
  const value = resolvePath(catalogs[locale], key);
  if (value !== undefined) {
    return interpolate(value, params);
  }

  const fallback = resolvePath(catalogs.en, key);
  if (fallback !== undefined) {
    return interpolate(fallback, params);
  }

  return key;
}

export function getGameMeta(
  locale: Locale,
  gameId: string
): { name: string; description: string } {
  return {
    name: t(locale, `games.${gameId}.name`),
    description: t(locale, `games.${gameId}.description`),
  };
}

export function getFtpPrompt(locale: Locale, promptKey: string): string {
  return t(locale, `games.finish_the_phrase.prompts.${promptKey}`);
}

export function getWyrQuestion(
  locale: Locale,
  questionKey: string
): { optionA: string; optionB: string } {
  const base = `games.would_you_rather.questions.${questionKey}`;
  return {
    optionA: t(locale, `${base}.optionA`),
    optionB: t(locale, `${base}.optionB`),
  };
}
