import type { Player } from "./player";

export interface MiniGameConfig {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number; // in seconds
}

export interface RoundEndResult {
  winnerId: string;
  stats: Record<string, any>;
}

export interface MiniGameEngine {
  config: MiniGameConfig;
  initialize(players: Player[]): void;
  handleAction(playerId: string, action: any): void;
  getState(): any;
  checkRoundEnd(): RoundEndResult | null;
  reset(): void;
}

export interface GameAction {
  type: string;
  payload?: any;
}

export interface GameStartData {
  gameId: string;
  gameName: string;
  players: Player[];
}

export interface RoundResult {
  winnerId: string;
  winnerName: string;
  stats: Record<string, any>;
  scores: Record<string, number>;
}
