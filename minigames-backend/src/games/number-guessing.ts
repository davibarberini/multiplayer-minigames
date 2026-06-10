import {
  MiniGameEngine,
  MiniGameConfig,
  RoundEndResult,
  Player,
  GameAction,
  GameState,
} from "../../../shared/types";

const config: MiniGameConfig = {
  id: "number_guessing",
  name: "Number Guessing",
  description: "Guess the secret number — higher or lower until you find it!",
  minPlayers: 2,
  maxPlayers: 8,
  estimatedDuration: 60,
};

const MIN_NUMBER = 1;
const MAX_NUMBER = 100;
const ROUND_SECONDS = 60;
const RESULTS_DISPLAY_MS = 5000;

type GameStatus = "guessing" | "results" | "ended";
type GuessHint = "higher" | "lower" | "correct";

interface GuessEntry {
  playerId: string;
  guess: number;
  hint: GuessHint;
}

interface NumberGuessingState {
  secretNumber: number;
  guesses: GuessEntry[];
  status: GameStatus;
  roundCountdown: number;
  winnerPlayerId: string | null;
  noWinner: boolean;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class NumberGuessingGame implements MiniGameEngine {
  config = config;
  private players: Player[] = [];
  private state: NumberGuessingState = {
    secretNumber: 0,
    guesses: [],
    status: "guessing",
    roundCountdown: 0,
    winnerPlayerId: null,
    noWinner: false,
  };
  private countdownInterval: NodeJS.Timeout | null = null;
  private resultsTimeout: NodeJS.Timeout | null = null;

  initialize(players: Player[]): void {
    this.players = players;
    this.state = {
      secretNumber: randomInt(MIN_NUMBER, MAX_NUMBER),
      guesses: [],
      status: "guessing",
      roundCountdown: ROUND_SECONDS,
      winnerPlayerId: null,
      noWinner: false,
    };
    this.startCountdown();
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.state.roundCountdown--;

      if (this.state.roundCountdown <= 0) {
        this.endByTimeout();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  handleAction(playerId: string, action: GameAction): void {
    if (action.type === "skip") {
      if (this.state.status === "results") {
        this.advanceToEnded();
      }
      return;
    }

    if (action.type !== "guess") return;
    if (this.state.status !== "guessing") return;
    if (this.state.winnerPlayerId) return;

    const guess = action.payload as number;
    if (
      typeof guess !== "number" ||
      !Number.isInteger(guess) ||
      guess < MIN_NUMBER ||
      guess > MAX_NUMBER
    ) {
      return;
    }

    const secret = this.state.secretNumber;
    let hint: GuessHint;
    if (guess === secret) {
      hint = "correct";
    } else if (guess < secret) {
      hint = "higher";
    } else {
      hint = "lower";
    }

    this.state.guesses.push({ playerId, guess, hint });

    if (hint === "correct") {
      this.state.winnerPlayerId = playerId;
      this.showResults();
    }
  }

  private endByTimeout(): void {
    this.clearCountdown();
    if (this.state.winnerPlayerId) return;

    this.state.noWinner = true;
    this.showResults();
  }

  private showResults(): void {
    this.clearCountdown();
    this.state.status = "results";

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
    const showSecret =
      this.state.status === "results" || this.state.status === "ended";

    return {
      status: this.state.status,
      minNumber: MIN_NUMBER,
      maxNumber: MAX_NUMBER,
      roundCountdown: this.state.roundCountdown,
      guesses: this.state.guesses,
      secretNumber: showSecret ? this.state.secretNumber : null,
      winnerPlayerId: this.state.winnerPlayerId,
      noWinner: this.state.noWinner,
      totalPlayers: this.players.length,
    };
  }

  checkRoundEnd(): RoundEndResult | null {
    if (this.state.status !== "ended") {
      return null;
    }

    if (this.state.winnerPlayerId) {
      return {
        winnerId: this.state.winnerPlayerId,
        stats: {
          secretNumber: this.state.secretNumber,
          guesses: this.state.guesses,
          winnerPlayerId: this.state.winnerPlayerId,
          noWinner: false,
        },
      };
    }

    return {
      winnerId: "",
      stats: {
        secretNumber: this.state.secretNumber,
        guesses: this.state.guesses,
        noWinner: true,
      },
    };
  }

  reset(): void {
    this.clearCountdown();
    if (this.resultsTimeout) {
      clearTimeout(this.resultsTimeout);
      this.resultsTimeout = null;
    }

    this.state = {
      secretNumber: 0,
      guesses: [],
      status: "guessing",
      roundCountdown: 0,
      winnerPlayerId: null,
      noWinner: false,
    };
  }
}
