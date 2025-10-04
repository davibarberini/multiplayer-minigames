import type { Lobby } from "./lobby";
import type { Player } from "./player";
import type {
  GameStartData,
  GameAction,
  RoundResult,
  MiniGameConfig,
} from "./game";

export interface ClientToServerEvents {
  create_lobby: (data: { username: string; color: string }) => void;
  join_lobby: (data: { code: string; username: string; color: string }) => void;
  leave_lobby: () => void;
  start_game: () => void;
  game_action: (action: GameAction) => void;
  request_next_round: () => void;
}

export interface ServerToClientEvents {
  lobby_created: (lobby: Lobby) => void;
  lobby_joined: (lobby: Lobby) => void;
  lobby_updated: (lobby: Lobby) => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string) => void;
  game_started: (gameData: GameStartData) => void;
  game_state_update: (state: any) => void;
  round_ended: (result: RoundResult) => void;
  game_ended: (winner: Player, finalScores: Record<string, number>) => void;
  error: (error: { message: string }) => void;
  available_games: (games: MiniGameConfig[]) => void;
}
