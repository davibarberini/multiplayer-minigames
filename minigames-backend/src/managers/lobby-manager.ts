import { Lobby, Player, LobbyConfig } from "../../../shared/types";
import {
  DEFAULT_POINTS_TO_WIN,
  LOBBY_CODE_LENGTH,
} from "../../../shared/constants";

class LobbyManager {
  private lobbies = new Map<string, Lobby>();

  createLobby(
    hostId: string,
    username: string,
    color: string,
    config?: Partial<LobbyConfig>
  ): Lobby {
    const code = this.generateCode();

    const hostPlayer: Player = {
      id: hostId,
      username,
      color,
      score: 0,
      isHost: true,
      isSpectator: false,
    };

    const lobby: Lobby = {
      code,
      hostId,
      players: [hostPlayer],
      config: {
        pointsToWin: config?.pointsToWin || DEFAULT_POINTS_TO_WIN,
        gameMode: config?.gameMode || "reaction_time",
        maxPlayers: config?.maxPlayers,
        isPrivate: config?.isPrivate !== undefined ? config.isPrivate : true,
      },
      status: "waiting",
    };

    this.lobbies.set(code, lobby);
    return lobby;
  }

  getLobby(code: string): Lobby | undefined {
    return this.lobbies.get(code);
  }

  addPlayer(
    code: string,
    playerId: string,
    username: string,
    color: string
  ): Lobby | null {
    const lobby = this.lobbies.get(code);
    if (!lobby) return null;

    // Check if player already exists
    const existingPlayer = lobby.players.find((p) => p.id === playerId);
    if (existingPlayer) {
      return lobby;
    }

    // Check max players
    if (
      lobby.config.maxPlayers &&
      lobby.players.length >= lobby.config.maxPlayers
    ) {
      return null;
    }

    const newPlayer: Player = {
      id: playerId,
      username,
      color,
      score: 0,
      isHost: false,
      isSpectator: false,
    };

    lobby.players.push(newPlayer);
    return lobby;
  }

  removePlayer(code: string, playerId: string): Lobby | null {
    const lobby = this.lobbies.get(code);
    if (!lobby) return null;

    lobby.players = lobby.players.filter((p) => p.id !== playerId);

    // If no players left, remove lobby
    if (lobby.players.length === 0) {
      this.lobbies.delete(code);
      return null;
    }

    // If host left, assign new host
    if (lobby.hostId === playerId && lobby.players.length > 0) {
      lobby.hostId = lobby.players[0].id;
      lobby.players[0].isHost = true;
    }

    return lobby;
  }

  updateLobbyStatus(code: string, status: Lobby["status"]): void {
    const lobby = this.lobbies.get(code);
    if (lobby) {
      lobby.status = status;
    }
  }

  updatePlayerScore(code: string, playerId: string, score: number): void {
    const lobby = this.lobbies.get(code);
    if (!lobby) return;

    const player = lobby.players.find((p) => p.id === playerId);
    if (player) {
      player.score = score;
    }
  }

  resetScores(code: string): void {
    const lobby = this.lobbies.get(code);
    if (!lobby) return;

    lobby.players.forEach((player) => {
      player.score = 0;
    });
  }

  removeLobby(code: string): void {
    this.lobbies.delete(code);
  }

  private generateCode(): string {
    let code: string;
    do {
      code = Math.random()
        .toString(36)
        .substring(2, 2 + LOBBY_CODE_LENGTH)
        .toUpperCase();
    } while (this.lobbies.has(code));
    return code;
  }

  // Cleanup inactive lobbies (can be called periodically)
  cleanupInactiveLobbies(_maxAgeMs: number = 3600000): void {
    // This is a simple implementation without lastActivity tracking
    // In production, you'd track lastActivity timestamp
    this.lobbies.forEach((lobby, code) => {
      if (lobby.players.length === 0) {
        this.lobbies.delete(code);
      }
    });
  }
}

export const lobbyManager = new LobbyManager();
