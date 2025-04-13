import WebSocket from "ws";

// Interface for WebSocket connections augmented with our data
export interface PlayerWebSocket extends WebSocket {
  clientId: string;
  // Add other potential properties if needed later
}

// Information stored about each connected player
export interface PlayerInfo {
  ws: PlayerWebSocket;
  name: string;
  id: string; // Same as ws.clientId
}

// Structure for defining available games
export interface GameDefinition {
  name: string;
  minPlayers: number;
  maxPlayers: number;
}

// Structure for storing lobby information
export interface Lobby {
  players: PlayerInfo[];
  host: PlayerInfo;
  hostId: string;
  name: string;
  code: string;
  gameType: string;
  maxPlayers: number;
  isPublic: boolean;
}

// Structure for player state within Space Duel
export interface SpaceDuelPlayerState {
  id: string;
  name: string;
  health: number;
  position: { x: number; y: number };
  plannedMove: { targetX: number; targetY: number } | null;
  plannedShot: { targetX: number; targetY: number } | null;
  actionSubmitted: boolean;
}

// Structure for the overall Space Duel game state
export interface SpaceDuelGameState {
  turn: number;
  phase: "planning" | "executing" | "finished";
  playerStates: { [clientId: string]: SpaceDuelPlayerState };
  projectiles: any[]; // TODO: Define projectile structure
}

// Interface for the base Game class (useful for GameManager)
export interface IGame {
  lobbyCode: string;
  players: PlayerInfo[];
  gameState: any; // Game-specific state structure
  initializeGame(): void;
  handlePlayerAction(clientId: string, payload: any): void;
  handlePlayerDisconnect(clientId: string): void;
  getSanitizedGameState(): any;
  cleanup?(): void;
}
