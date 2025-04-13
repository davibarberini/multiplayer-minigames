import WebSocket from "ws";
import SpaceDuelGame from "./games/space_duel"; // Assuming SpaceDuelGame uses default export
import { PlayerInfo, PlayerWebSocket, IGame } from "./types";

// Define the type for the map storing active games
interface ActiveGamesMap {
  [lobbyCode: string]: IGame; // Use the IGame interface
}

// Map from lobbyCode to game instance
const activeGames: ActiveGamesMap = {};

class GameManager {
  /**
   * Creates a new game instance for a lobby.
   * @param {string} gameType - The type of game to create (e.g., 'spaceDuel').
   * @param {string} lobbyCode - The unique code for the lobby/game.
   * @param {Array<object>} players - Array of playerInfo objects ({ ws, name, id }).
   * @param {object} gameOptions - Optional game-specific settings.
   * @returns {object|null} The created game instance or null if type is invalid.
   */
  createGame(
    gameType: string,
    lobbyCode: string,
    players: PlayerInfo[],
    gameOptions: object = {}
  ): IGame | null {
    if (activeGames[lobbyCode]) {
      console.warn(
        `GameManager: Attempted to create game for already active lobby ${lobbyCode}`
      );
      return activeGames[lobbyCode]; // Return existing game
    }

    let gameInstance: IGame | null = null;
    switch (gameType) {
      case "spaceDuel":
        // Pass the broadcast function bound to this instance
        gameInstance = new SpaceDuelGame(
          lobbyCode,
          players,
          gameOptions,
          this.broadcastToPlayers.bind(this)
        );
        break;
      // Add cases for other game types here
      default:
        console.error(`GameManager: Unknown game type requested: ${gameType}`);
        return null;
    }

    if (gameInstance) {
      activeGames[lobbyCode] = gameInstance;
      console.log(
        `GameManager: Created ${gameType} game for lobby ${lobbyCode}`
      );
    }
    return gameInstance;
  }

  /**
   * Retrieves the active game instance for a lobby.
   * @param {string} lobbyCode - The lobby code.
   * @returns {object|null} The game instance or null if not found.
   */
  getGame(lobbyCode: string): IGame | null {
    return activeGames[lobbyCode] || null;
  }

  /**
   * Handles an incoming action message for a specific game.
   * @param {string} lobbyCode - The lobby the action belongs to.
   * @param {string} clientId - The ID of the player performing the action.
   * @param {object} actionPayload - The payload of the action message.
   */
  handleGameAction(
    lobbyCode: string,
    clientId: string,
    actionPayload: any
  ): void {
    const game = this.getGame(lobbyCode);
    if (game) {
      game.handlePlayerAction(clientId, actionPayload);
    } else {
      console.warn(
        `GameManager: Received action for inactive/invalid game ${lobbyCode}`
      );
      // Optionally find player and send error back?
      // const player = Object.values(players).find(p => p.id === clientId); // Need access to players map
      // if (player) this.sendError(player.ws, 'Game not found.');
    }
  }

  /**
   * Handles a player disconnecting from a game.
   * @param {string} lobbyCode - The lobby the player was in.
   * @param {string} clientId - The ID of the disconnected player.
   */
  handlePlayerDisconnect(lobbyCode: string, clientId: string): void {
    const game = this.getGame(lobbyCode);
    if (game) {
      game.handlePlayerDisconnect(clientId);
      // If the game ends itself due to disconnect, it should manage its state.
      // We might not need to explicitly call endGame here anymore, let the game decide?
    } else {
      console.log(
        `GameManager: Player ${clientId} disconnected from non-active/unknown game ${lobbyCode}`
      );
    }
  }

  /**
   * Removes a game instance when it's finished or lobby is destroyed.
   * @param {string} lobbyCode - The lobby code of the game to remove.
   */
  endGame(lobbyCode: string): void {
    const game = activeGames[lobbyCode];
    if (game) {
      if (typeof game.cleanup === "function") {
        game.cleanup();
      }
      delete activeGames[lobbyCode];
      console.log(`GameManager: Ended and removed game for lobby ${lobbyCode}`);
    } else {
      // This might be called multiple times (e.g., game ends itself, then lobby cleanup tries again)
      // So warning might not be necessary unless debugging.
      // console.warn(`GameManager: Attempted to end non-existent game ${lobbyCode}`);
    }
  }

  /**
   * Helper to broadcast messages to players within a specific game instance.
   * The game instance will call this.
   * @param {Array<object>} players - Array of playerInfo objects in the game.
   * @param {object} message - The message object to send (will be JSON.stringified).
   * @param {string} [excludeClientId] - Optional client ID to exclude from the broadcast.
   */
  broadcastToPlayers(
    players: PlayerInfo[],
    message: object,
    excludeClientId: string | null = null
  ): void {
    console.log(
      "GameManager: Attempting to broadcast message:",
      JSON.stringify(message, null, 2)
    ); // Log the message structure PRE-stringify

    let messageString: string;
    try {
      messageString = JSON.stringify(message);
    } catch (error) {
      console.error(
        "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
      );
      console.error(
        `GameManager: ERROR during JSON.stringify in broadcastToPlayers!`
      );
      console.error("Error:", error);
      // Use type assertion if error is expected to have a message property
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
      console.error("Original message object structure:", message);
      // Log structure of nested objects that might cause issues
      if ((message as any).payload && (message as any).payload.playerStates) {
        console.error(
          "Payload playerStates structure:",
          (message as any).payload.playerStates
        );
      }
      console.error(
        "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
      );
      return; // Don't proceed if stringify fails
    }

    players.forEach((pInfo) => {
      // Check player websocket exists and is open
      if (
        pInfo.ws &&
        pInfo.id !== excludeClientId &&
        pInfo.ws.readyState === WebSocket.OPEN
      ) {
        try {
          pInfo.ws.send(messageString);
        } catch (sendError) {
          console.error(
            `GameManager: Error sending message to client ${pInfo.id}:`,
            sendError
          );
        }
      }
    });
  }

  /**
   * Helper to send an error message directly to a specific websocket.
   * NOTE: This requires access to the PlayerWebSocket instance.
   * Consider moving error sending logic into the main server.ts or game instances.
   */
  // sendError(ws: PlayerWebSocket, message: string): void {
  //     if (ws && ws.readyState === WebSocket.OPEN) {
  //         ws.send(JSON.stringify({ type: 'error', payload: message }));
  //     }
  // }
}

// Export a single instance of the manager
const gameManagerInstance = new GameManager();
export default gameManagerInstance;
