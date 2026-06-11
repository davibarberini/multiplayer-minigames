export const FTP_PROMPT_KEYS = [
  "worstSuperpower",
  "petEvilPlan",
  "uselessStartup",
  "movieVillainCatchphrase",
  "weirdPizza",
  "linkedinHeadline",
  "autobiographyTitle",
  "worstLateExcuse",
  "terribleRestaurantName",
  "spiritAnimal",
  "nightmareAlarm",
  "broccoliTalk",
  "presidentialSlogan",
  "dancePartyMove",
  "chaoticWeddingVow",
] as const;

export type FtpPromptKey = (typeof FTP_PROMPT_KEYS)[number];

export const WYR_QUESTION_KEYS = [
  "superStrength",
  "readMinds",
  "noInternet",
  "lateOrEarly",
  "noTasteOrColor",
  "photographicMemory",
  "famousOrLoved",
  "teethOrHair",
  "languagesOrInstruments",
  "moneyOrTime",
  "noMusicOrColors",
  "timeTravelOrTeleport",
  "animalsOrPlants",
  "noFriendsOrFamily",
  "fireOrWater",
] as const;

export type WyrQuestionKey = (typeof WYR_QUESTION_KEYS)[number];

export const GAME_IDS = [
  "reaction_time",
  "would_you_rather",
  "higher_lower",
  "number_guessing",
  "finish_the_phrase",
] as const;

export type GameId = (typeof GAME_IDS)[number];
