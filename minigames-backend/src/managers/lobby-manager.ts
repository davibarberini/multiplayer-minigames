import { Lobby, Player, LobbyConfig } from "../../../shared/types";
import {
  DEFAULT_POINTS_TO_WIN,
  LOBBY_CODE_LENGTH,
} from "../../../shared/constants";
import { getAllGameIds, isValidGameId } from "../games/registry";

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

class LobbyManager {
  private lobbies = new Map<string, Lobby>();
  private rotationPools = new Map<string, string[]>();

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
        selectedGames: config?.selectedGames || getAllGameIds(),
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

    const existingPlayer = lobby.players.find((p) => p.id === playerId);
    if (existingPlayer) {
      return lobby;
    }

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

    if (lobby.players.length === 0) {
      this.rotationPools.delete(code);
      this.lobbies.delete(code);
      return null;
    }

    if (lobby.hostId === playerId && lobby.players.length > 0) {
      lobby.hostId = lobby.players[0].id;
      lobby.players[0].isHost = true;
    }

    return lobby;
  }

  updateSelectedGames(code: string, gameIds: string[]): Lobby | null {
    const lobby = this.lobbies.get(code);
    if (!lobby) return null;

    const validIds = gameIds.filter((id) => isValidGameId(id));
    const uniqueIds = [...new Set(validIds)];

    if (uniqueIds.length === 0) return null;

    lobby.config.selectedGames = uniqueIds;
    this.clearRotationPool(code);
    return lobby;
  }

  initRotationPool(code: string): void {
    const lobby = this.lobbies.get(code);
    if (!lobby) return;

    this.rotationPools.set(code, shuffle([...lobby.config.selectedGames]));
  }

  pickNextGameId(code: string): string | null {
    const lobby = this.lobbies.get(code);
    if (!lobby || lobby.config.selectedGames.length === 0) return null;

    let pool = this.rotationPools.get(code);
    if (!pool || pool.length === 0) {
      this.initRotationPool(code);
      pool = this.rotationPools.get(code);
    }

    if (!pool || pool.length === 0) return null;

    const nextId = pool.pop();
    if (nextId) {
      this.rotationPools.set(code, pool);
      return nextId;
    }

    return null;
  }

  clearRotationPool(code: string): void {
    this.rotationPools.delete(code);
  }

  setCurrentGame(code: string, gameId: string | undefined): void {
    const lobby = this.lobbies.get(code);
    if (lobby) {
      lobby.currentGame = gameId;
    }
  }

  endSession(code: string): Lobby | null {
    const lobby = this.lobbies.get(code);
    if (!lobby) return null;

    lobby.status = "waiting";
    lobby.currentGame = undefined;
    this.clearRotationPool(code);
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
    this.rotationPools.delete(code);
    this.lobbies.delete(code);
  }

  getPublicLobbies(): Lobby[] {
    return Array.from(this.lobbies.values()).filter(
      (lobby) => !lobby.config.isPrivate && lobby.status === "waiting"
    );
  }

  toggleLobbyPrivacy(code: string, isPrivate: boolean): Lobby | null {
    const lobby = this.lobbies.get(code);
    if (!lobby) return null;

    lobby.config.isPrivate = isPrivate;
    return lobby;
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

  cleanupInactiveLobbies(_maxAgeMs: number = 3600000): void {
    this.lobbies.forEach((lobby, code) => {
      if (lobby.players.length === 0) {
        this.rotationPools.delete(code);
        this.lobbies.delete(code);
      }
    });
  }
}

export const lobbyManager = new LobbyManager();
