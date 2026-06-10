import {
  MiniGameEngine,
  MiniGameConfig,
  RoundEndResult,
  Player,
  GameAction,
  GameState,
} from "../../../shared/types";

const config: MiniGameConfig = {
  id: "higher_lower",
  name: "Higher or Lower",
  description: "Guess if the next number will be higher or lower!",
  minPlayers: 2,
  maxPlayers: 8,
  estimatedDuration: 25,
};

const MIN_NUMBER = 1;
const MAX_NUMBER = 100;
const VOTE_SECONDS = 12;
const RESULTS_DISPLAY_MS = 5000;

type VoteChoice = "higher" | "lower";
type GameStatus = "waiting" | "voting" | "results" | "ended";

interface HigherLowerResults {
  higher: number;
  lower: number;
  winners: string[];
  actualDirection: VoteChoice;
}

interface HigherLowerState {
  currentNumber: number | null;
  nextNumber: number | null;
  votes: Map<string, VoteChoice>;
  status: GameStatus;
  voteCountdown: number;
  results?: HigherLowerResults;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNextNumber(current: number): number {
  if (current <= MIN_NUMBER) {
    return randomInt(current + 1, MAX_NUMBER);
  }
  if (current >= MAX_NUMBER) {
    return randomInt(MIN_NUMBER, current - 1);
  }
  const goHigher = Math.random() < 0.5;
  return goHigher
    ? randomInt(current + 1, MAX_NUMBER)
    : randomInt(MIN_NUMBER, current - 1);
}

export class HigherLowerGame implements MiniGameEngine {
  config = config;
  private players: Player[] = [];
  private state: HigherLowerState = {
    currentNumber: null,
    nextNumber: null,
    votes: new Map(),
    status: "waiting",
    voteCountdown: 0,
  };
  private countdownInterval: NodeJS.Timeout | null = null;
  private resultsTimeout: NodeJS.Timeout | null = null;

  initialize(players: Player[]): void {
    this.players = players;
    const currentNumber = randomInt(MIN_NUMBER, MAX_NUMBER);
    const nextNumber = generateNextNumber(currentNumber);

    this.state = {
      currentNumber,
      nextNumber,
      votes: new Map(),
      status: "voting",
      voteCountdown: VOTE_SECONDS,
    };

    this.startCountdown();
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.state.voteCountdown--;

      if (this.state.voteCountdown <= 0) {
        this.endVoting();
      }
    }, 1000);
  }

  handleAction(playerId: string, action: GameAction): void {
    if (action.type === "skip") {
      if (this.state.status === "results") {
        this.advanceToEnded();
      }
      return;
    }

    if (action.type !== "vote") return;
    if (this.state.status !== "voting") return;

    const choice = action.payload as VoteChoice;
    if (choice !== "higher" && choice !== "lower") return;

    this.state.votes.set(playerId, choice);

    if (this.state.votes.size >= this.players.length) {
      this.endVoting();
    }
  }

  private endVoting(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.state.status = "results";

    const current = this.state.currentNumber ?? 0;
    const next = this.state.nextNumber ?? 0;
    const actualDirection: VoteChoice = next > current ? "higher" : "lower";

    let higherCount = 0;
    let lowerCount = 0;
    const winners: string[] = [];

    this.state.votes.forEach((vote, playerId) => {
      if (vote === "higher") higherCount++;
      else lowerCount++;

      if (vote === actualDirection) {
        winners.push(playerId);
      }
    });

    this.state.results = {
      higher: higherCount,
      lower: lowerCount,
      winners,
      actualDirection,
    };

    this.resultsTimeout = setTimeout(() => {
      this.advanceToEnded();
    }, RESULTS_DISPLAY_MS);
  }

  private advanceToEnded(): void {
    if (this.resultsTimeout) {
      clearTimeout(this.resultsTimeout);
      this.resultsTimeout = null;
    }
    this.state.status = "ended";
  }

  getState(): GameState {
    const showNextNumber = this.state.status === "results" || this.state.status === "ended";

    return {
      status: this.state.status,
      currentNumber: this.state.currentNumber,
      nextNumber: showNextNumber ? this.state.nextNumber : null,
      votes: Array.from(this.state.votes.entries()),
      voteCountdown: this.state.voteCountdown,
      results: this.state.results,
      totalPlayers: this.players.length,
      votedPlayers: this.state.votes.size,
      minNumber: MIN_NUMBER,
      maxNumber: MAX_NUMBER,
    };
  }

  checkRoundEnd(): RoundEndResult | null {
    if (this.state.status !== "ended") {
      return null;
    }

    const winners = this.state.results?.winners ?? [];
    const winnerId =
      winners.length > 0
        ? winners[Math.floor(Math.random() * winners.length)]
        : this.players[0]?.id || "";

    return {
      winnerId,
      stats: {
        currentNumber: this.state.currentNumber,
        nextNumber: this.state.nextNumber,
        results: this.state.results,
        totalVotes: this.state.votes.size,
      },
    };
  }

  reset(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.resultsTimeout) {
      clearTimeout(this.resultsTimeout);
      this.resultsTimeout = null;
    }

    this.state = {
      currentNumber: null,
      nextNumber: null,
      votes: new Map(),
      status: "waiting",
      voteCountdown: 0,
    };
  }
}
