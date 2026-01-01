import type { Player } from "./player";

export interface MiniGameConfig {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number; // in seconds
}

// Generic game state - games can have different state structures
export interface GameState {
  status: string;
  [key: string]: unknown;
}

// Statistics can vary by game type
export interface GameStats {
  [key: string]: unknown;
}

export interface RoundEndResult {
  winnerId: string;
  stats: GameStats;
}

export interface MiniGameEngine {
  config: MiniGameConfig;
  initialize(players: Player[]): void;
  handleAction(playerId: string, action: GameAction): void;
  getState(): GameState;
  checkRoundEnd(): RoundEndResult | null;
  reset(): void;
}

export interface GameAction {
  type: string;
  payload?: unknown;
}

export interface GameStartData {
  gameId: string;
  gameName: string;
  players: Player[];
}

export interface RoundResult {
  winnerId: string;
  winnerName: string;
  stats: GameStats;
  scores: Record<string, number>;
}
