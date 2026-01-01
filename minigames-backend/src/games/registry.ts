import { ReactionTimeGame } from "./reaction-time";
import { WouldYouRatherGame } from "./would-you-rather";
import { MiniGameEngine, Player, MiniGameConfig } from "../../../shared/types";

type GameConstructor = new () => MiniGameEngine;

export const GAME_REGISTRY: Record<string, GameConstructor> = {
  reaction_time: ReactionTimeGame,
  would_you_rather: WouldYouRatherGame,
};

export function getAvailableGames(): MiniGameConfig[] {
  return Object.values(GAME_REGISTRY).map(
    (GameClass) => new GameClass().config
  );
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
