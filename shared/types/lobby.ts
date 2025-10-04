import type { Player } from "./player";

export interface LobbyConfig {
  pointsToWin: number;
  gameMode: string | "random";
  maxPlayers?: number;
  isPrivate: boolean;
}

export interface Lobby {
  code: string;
  hostId: string;
  players: Player[];
  config: LobbyConfig;
  status: "waiting" | "in_game" | "finished";
  currentGame?: string;
}
