import { ReactionTimeGame } from "./reaction-time";
import { WouldYouRatherGame } from "./would-you-rather";
import { HigherLowerGame } from "./higher-lower";
import { NumberGuessingGame } from "./number-guessing";
import { MiniGameEngine, Player, MiniGameConfig } from "../../../shared/types";

type GameConstructor = new () => MiniGameEngine;

export const GAME_REGISTRY: Record<string, GameConstructor> = {
  reaction_time: ReactionTimeGame,
  would_you_rather: WouldYouRatherGame,
  higher_lower: HigherLowerGame,
  number_guessing: NumberGuessingGame,
};

export function getAvailableGames(): MiniGameConfig[] {
  return Object.values(GAME_REGISTRY).map(
    (GameClass) => new GameClass().config
  );
}

export function isValidGameId(gameId: string): boolean {
  return gameId in GAME_REGISTRY;
}

export function getAllGameIds(): string[] {
  return Object.keys(GAME_REGISTRY);
}

export function createGame(gameId: string, players: Player[]): MiniGameEngine {
  const GameClass = GAME_REGISTRY[gameId];
  if (!GameClass) {
    throw new Error(`Game ${gameId} not found`);
  }

  const game = new GameClass();
  game.initialize(players);
  return game;
}
