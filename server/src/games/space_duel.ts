import {
  PlayerInfo,
  SpaceDuelGameState,
  SpaceDuelPlayerState,
  IGame,
} from "../types";
import WebSocket from "ws";

// Define the structure for the broadcast callback function more explicitly
type BroadcastFunction = (
  players: PlayerInfo[],
  message: object,
  excludeClientId?: string
) => void;

class SpaceDuelGame implements IGame {
  public lobbyCode: string;
  public players: PlayerInfo[]; // Array of playerInfo objects { ws, name, id }
  private options: object;
  private broadcast: BroadcastFunction; // Function to send messages to players

  public gameState: SpaceDuelGameState;

  constructor(
    lobbyCode: string,
    players: PlayerInfo[],
    options: object,
    broadcastCallback: BroadcastFunction
  ) {
    this.lobbyCode = lobbyCode;
    this.players = players;
    this.options = options;
    this.broadcast = broadcastCallback;

    this.gameState = {
      turn: 0,
      phase: "planning",
      playerStates: {},
      projectiles: [],
    };

    this.initializeGame();
  }

  initializeGame(): void {
    console.log(`Initializing Space Duel game for lobby ${this.lobbyCode}`);
    // Setup initial game state
    this.players.forEach((p, index) => {
      // Simple alternating start positions
      const startX = index === 0 ? 100 : 400;
      const startY = index === 0 ? 100 : 400;

      this.gameState.playerStates[p.id] = {
        id: p.id,
        name: p.name,
        health: 1,
        position: { x: startX, y: startY },
        plannedMove: null,
        plannedShot: null,
        actionSubmitted: false,
      };
    });

    // Send the initial game state to all players
    this.broadcast(this.players, {
      type: "gameUpdate",
      payload: this.getSanitizedGameState(),
    });
  }

  handlePlayerAction(clientId: string, payload: any): void {
    console.log(
      `SpaceDuel (${this.lobbyCode}): Action from ${clientId}`,
      payload
    );

    if (this.gameState.phase !== "planning") {
      this.sendError(clientId, "Not in planning phase.");
      return;
    }

    const playerState = this.gameState.playerStates[clientId];
    if (!playerState || playerState.actionSubmitted) {
      this.sendError(clientId, "Action already submitted or player not found.");
      return;
    }

    if (payload.action === "submitTurn") {
      // Basic validation (check if move/shot are objects or null)
      const move = payload.move;
      const shot = payload.shot;
      if (
        move &&
        (typeof move.targetX !== "number" || typeof move.targetY !== "number")
      ) {
        this.sendError(clientId, "Invalid move format.");
        return;
      }
      if (
        shot &&
        (typeof shot.targetX !== "number" || typeof shot.targetY !== "number")
      ) {
        this.sendError(clientId, "Invalid shot format.");
        return;
      }

      playerState.plannedMove = move
        ? { targetX: move.targetX, targetY: move.targetY }
        : null;
      playerState.plannedShot = shot
        ? { targetX: shot.targetX, targetY: shot.targetY }
        : null;
      playerState.actionSubmitted = true;
      console.log(`Player ${clientId} submitted actions.`);

      // Notify player their action was received (optional)
      // this.sendToPlayer(clientId, { type: 'actionConfirmed' });

      // Broadcast update showing player is ready
      this.broadcast(this.players, {
        type: "gameUpdate",
        payload: this.getSanitizedGameState(), // Send updated state showing actionSubmitted
      });

      if (this.checkAllActionsSubmitted()) {
        this.executeTurn();
      }
    } else {
      this.sendError(clientId, `Unknown action type: ${payload.action}`);
    }
  }

  checkAllActionsSubmitted(): boolean {
    return this.players.every(
      (p) => this.gameState.playerStates[p.id]?.actionSubmitted
    );
  }

  executeTurn(): void {
    console.log(
      `SpaceDuel (${this.lobbyCode}): Executing turn ${this.gameState.turn}`
    );
    this.gameState.phase = "executing";

    // Broadcast that execution is starting
    this.broadcast(this.players, {
      type: "gameUpdate",
      payload: this.getSanitizedGameState(), // Shows phase changed to executing
    });

    // --- TODO: Implement real turn execution logic ---
    // This should likely involve timers/intervals for smooth animation on client
    // and broadcasting smaller state updates during execution.
    // For now: Instant resolution as placeholder.

    // 1. Move ships
    this.players.forEach((p) => {
      const state = this.gameState.playerStates[p.id];
      if (state.plannedMove) {
        state.position.x = state.plannedMove.targetX;
        state.position.y = state.plannedMove.targetY;
      }
    });

    // 2. Fire projectiles (if any)
    // 3. Check collisions
    // 4. Update health

    // --- End Placeholder Execution ---

    // Reset actions for next turn
    this.players.forEach((p) => {
      const state = this.gameState.playerStates[p.id];
      if (state) {
        state.plannedMove = null;
        state.plannedShot = null;
        state.actionSubmitted = false;
      }
    });

    // Check for winner
    const alivePlayers = this.players.filter(
      (p) => this.gameState.playerStates[p.id]?.health > 0
    );
    if (alivePlayers.length <= 1) {
      this.endGame(alivePlayers.length === 1 ? alivePlayers[0].id : null);
      return;
    }

    // Transition back to planning
    this.gameState.turn++;
    this.gameState.phase = "planning";

    // Broadcast the final state of this turn
    setTimeout(() => {
      // Add slight delay before next planning phase starts
      this.broadcast(this.players, {
        type: "gameUpdate",
        payload: this.getSanitizedGameState(),
      });
      console.log(
        `SpaceDuel (${this.lobbyCode}): Finished turn ${this.gameState.turn}, back to planning.`
      );
    }, 500); // 0.5 second delay
  }

  endGame(winnerClientId: string | null): void {
    console.log(
      `SpaceDuel (${this.lobbyCode}): Game ended. Winner: ${
        winnerClientId || "Draw/None"
      }`
    );
    this.gameState.phase = "finished";
    this.broadcast(this.players, {
      type: "gameOver",
      payload: {
        winnerId: winnerClientId,
        finalState: this.getSanitizedGameState(),
      },
    });
    // TODO: Notify GameManager via callback?
  }

  handlePlayerDisconnect(clientId: string): void {
    console.log(
      `SpaceDuel (${this.lobbyCode}): Player ${clientId} disconnected.`
    );
    const disconnectedPlayer = this.players.find((p) => p.id === clientId);
    this.players = this.players.filter((p) => p.id !== clientId);

    // If game hasn't finished, remaining player wins
    if (this.gameState.phase !== "finished" && this.players.length < 2) {
      console.log(`Ending game due to disconnect.`);
      this.endGame(this.players.length === 1 ? this.players[0].id : null);
    } else if (this.gameState.phase === "planning" && disconnectedPlayer) {
      // If disconnected player had submitted, re-check if turn can execute now
      if (this.gameState.playerStates[clientId]?.actionSubmitted) {
        if (this.checkAllActionsSubmitted()) {
          this.executeTurn();
        }
      }
    }
    // TODO: Broadcast a specific player_disconnected_game event?
  }

  getSanitizedGameState(): Omit<SpaceDuelGameState, "projectiles"> & {
    projectiles: any[];
  } {
    // Example of more specific typing
    // Create a clean copy for sending to clients
    const sanitizedState: any = {
      turn: this.gameState.turn,
      phase: this.gameState.phase,
      playerStates: {},
      projectiles: this.gameState.projectiles.map((p) => ({ ...p })),
    };

    for (const playerId in this.gameState.playerStates) {
      const player = this.gameState.playerStates[playerId];
      sanitizedState.playerStates[playerId] = {
        id: player.id,
        name: player.name,
        health: player.health,
        position: { ...player.position },
        actionSubmitted: player.actionSubmitted,
        // DO NOT send plannedMove or plannedShot to other players
      };
    }
    return sanitizedState;
  }

  sendToPlayer(clientId: string, message: object): void {
    const player = this.players.find((p) => p.id === clientId);
    if (player && player.ws.readyState === WebSocket.OPEN) {
      try {
        player.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(
          `SpaceDuel: Error sending message to ${clientId}:`,
          error
        );
      }
    }
  }

  sendError(clientId: string, message: string): void {
    this.sendToPlayer(clientId, { type: "gameError", payload: message });
  }

  cleanup(): void {
    console.log(`SpaceDuel (${this.lobbyCode}): Cleaning up game instance.`);
  }
}

export default SpaceDuelGame;
