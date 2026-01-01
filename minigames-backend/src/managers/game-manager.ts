import {
  MiniGameEngine,
  Player,
  RoundEndResult,
  GameAction,
  GameState,
} from "../../../shared/types";

class GameManager {
  private activeGames = new Map<string, MiniGameEngine>(); // key: lobby code

  startGame(
    lobbyCode: string,
    gameEngine: MiniGameEngine,
    players: Player[]
  ): void {
    gameEngine.initialize(players);
    this.activeGames.set(lobbyCode, gameEngine);
  }

  getGame(lobbyCode: string): MiniGameEngine | undefined {
    return this.activeGames.get(lobbyCode);
  }

  handleAction(lobbyCode: string, playerId: string, action: GameAction): void {
    const game = this.activeGames.get(lobbyCode);
    if (game) {
      game.handleAction(playerId, action);
    }
  }

  getGameState(lobbyCode: string): GameState | null {
    const game = this.activeGames.get(lobbyCode);
    return game ? game.getState() : null;
  }

  checkRoundEnd(lobbyCode: string): RoundEndResult | null {
    const game = this.activeGames.get(lobbyCode);
    return game ? game.checkRoundEnd() : null;
  }

  resetGame(lobbyCode: string): void {
    const game = this.activeGames.get(lobbyCode);
    if (game) {
      game.reset();
    }
  }

  endGame(lobbyCode: string): void {
    const game = this.activeGames.get(lobbyCode);
    if (game) {
      game.reset();
    }
    this.activeGames.delete(lobbyCode);
  }
}

export const gameManager = new GameManager();
