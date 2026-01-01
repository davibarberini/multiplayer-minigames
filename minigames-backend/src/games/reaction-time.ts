import {
  MiniGameEngine,
  MiniGameConfig,
  RoundEndResult,
  Player,
  GameAction,
  GameState,
} from "../../../shared/types";

const config: MiniGameConfig = {
  id: "reaction_time",
  name: "Reaction Time",
  description: "Click as fast as you can when the screen turns green!",
  minPlayers: 2,
  maxPlayers: 8,
  estimatedDuration: 10,
};

interface ReactionTimeState {
  startTime: number | null;
  greenTime: number | null;
  responses: Map<string, number>;
  status: "waiting" | "ready" | "green" | "ended";
}

export class ReactionTimeGame implements MiniGameEngine {
  config = config;
  private players: Player[] = [];
  private state: ReactionTimeState = {
    startTime: null,
    greenTime: null,
    responses: new Map(),
    status: "waiting",
  };
  private greenTimeout: NodeJS.Timeout | null = null;

  initialize(players: Player[]): void {
    this.players = players;
    this.state = {
      startTime: Date.now(),
      greenTime: null,
      responses: new Map(),
      status: "ready",
    };

    // Schedule green light after random delay (2-5 seconds)
    const delay = 2000 + Math.random() * 3000;
    this.greenTimeout = setTimeout(() => {
      this.state.status = "green";
      this.state.greenTime = Date.now();
    }, delay);
  }

  handleAction(playerId: string, action: GameAction): void {
    if (action.type !== "click") return;

    // If clicked before green
    if (this.state.status !== "green") {
      this.state.responses.set(playerId, -1);
      return;
    }

    // If already clicked
    if (this.state.responses.has(playerId)) return;

    // Record response time
    const responseTime = Date.now() - (this.state.greenTime || 0);
    this.state.responses.set(playerId, responseTime);
  }

  getState(): GameState {
    return {
      status: this.state.status,
      responses: Array.from(this.state.responses.entries()),
      playersRemaining: this.players.length - this.state.responses.size,
    };
  }

  checkRoundEnd(): RoundEndResult | null {
    // End when all players responded
    if (this.state.responses.size >= this.players.length) {
      this.state.status = "ended";
      return this.determineWinner();
    }

    // End after timeout (3 seconds after green)
    if (
      this.state.status === "green" &&
      this.state.greenTime &&
      Date.now() - this.state.greenTime > 3000
    ) {
      this.state.status = "ended";
      return this.determineWinner();
    }

    return null;
  }

  private determineWinner(): RoundEndResult {
    let fastestPlayerId = "";
    let fastestTime = Infinity;

    this.state.responses.forEach((time, playerId) => {
      if (time > 0 && time < fastestTime) {
        fastestTime = time;
        fastestPlayerId = playerId;
      }
    });

    // If no valid responses (everyone clicked early), pick first player
    if (!fastestPlayerId && this.players.length > 0) {
      fastestPlayerId = this.players[0].id;
    }

    return {
      winnerId: fastestPlayerId,
      stats: {
        responses: Object.fromEntries(this.state.responses.entries()),
        fastestTime: fastestTime === Infinity ? 0 : fastestTime,
      },
    };
  }

  reset(): void {
    if (this.greenTimeout) {
      clearTimeout(this.greenTimeout);
      this.greenTimeout = null;
    }
    this.state = {
      startTime: null,
      greenTime: null,
      responses: new Map(),
      status: "waiting",
    };
  }
}
