import {
  MiniGameEngine,
  MiniGameConfig,
  RoundEndResult,
  Player,
  GameAction,
  GameState,
} from "../../../shared/types";

const config: MiniGameConfig = {
  id: "would_you_rather",
  name: "Would You Rather",
  description: "Choose between two options and see what others picked!",
  minPlayers: 2,
  maxPlayers: 8,
  estimatedDuration: 30,
};

// Questions database
const QUESTIONS = [
  { optionA: "Have super strength", optionB: "Have the ability to fly" },
  { optionA: "Be able to read minds", optionB: "Be able to become invisible" },
  { optionA: "Live without internet", optionB: "Live without AC/heating" },
  { optionA: "Always be 10 minutes late", optionB: "Always be 20 minutes early" },
  { optionA: "Have no taste buds", optionB: "Be color blind" },
  { optionA: "Have a photographic memory", optionB: "Have the ability to forget anything" },
  { optionA: "Be famous but hated", optionB: "Be unknown but loved" },
  { optionA: "Have perfect teeth", optionB: "Have perfect hair" },
  { optionA: "Be able to speak all languages", optionB: "Be able to play all instruments" },
  { optionA: "Have unlimited money", optionB: "Have unlimited time" },
  { optionA: "Live in a world without music", optionB: "Live in a world without colors" },
  { optionA: "Have the ability to time travel", optionB: "Have the ability to teleport" },
  { optionA: "Be able to talk to animals", optionB: "Be able to talk to plants" },
  { optionA: "Have no friends", optionB: "Have no family" },
  { optionA: "Be able to control fire", optionB: "Be able to control water" },
];

interface WouldYouRatherState {
  question: { optionA: string; optionB: string } | null;
  votes: Map<string, "A" | "B">;
  status: "waiting" | "voting" | "results" | "ended";
  voteCountdown: number;
  results?: {
    optionA: number;
    optionB: number;
    winners: string[];
  };
}

export class WouldYouRatherGame implements MiniGameEngine {
  config = config;
  private players: Player[] = [];
  private state: WouldYouRatherState = {
    question: null,
    votes: new Map(),
    status: "waiting",
    voteCountdown: 0,
  };
  private countdownInterval: NodeJS.Timeout | null = null;

  initialize(players: Player[]): void {
    this.players = players;
    const randomQuestion =
      QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

    this.state = {
      question: randomQuestion,
      votes: new Map(),
      status: "voting",
      voteCountdown: 15, // 15 seconds to vote
    };

    // Start countdown
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
    if (action.type !== "vote") return;
    if (this.state.status !== "voting") return;

    const choice = action.payload as "A" | "B";
    if (choice !== "A" && choice !== "B") return;

    // Player can change their vote
    this.state.votes.set(playerId, choice);
  }

  private endVoting(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.state.status = "results";

    // Count votes
    let optionACount = 0;
    let optionBCount = 0;

    this.state.votes.forEach((vote) => {
      if (vote === "A") optionACount++;
      else optionBCount++;
    });

    // Determine winners (majority wins, if tie no one wins)
    const winners: string[] = [];
    if (optionACount > optionBCount) {
      this.state.votes.forEach((vote, playerId) => {
        if (vote === "A") winners.push(playerId);
      });
    } else if (optionBCount > optionACount) {
      this.state.votes.forEach((vote, playerId) => {
        if (vote === "B") winners.push(playerId);
      });
    }
    // If tie, winners array stays empty

    this.state.results = {
      optionA: optionACount,
      optionB: optionBCount,
      winners,
    };

    // Auto-end after showing results for 5 seconds
    setTimeout(() => {
      this.state.status = "ended";
    }, 5000);
  }

  getState(): GameState {
    return {
      status: this.state.status,
      question: this.state.question,
      votes: Array.from(this.state.votes.entries()),
      voteCountdown: this.state.voteCountdown,
      results: this.state.results,
      totalPlayers: this.players.length,
      votedPlayers: this.state.votes.size,
    };
  }

  checkRoundEnd(): RoundEndResult | null {
    if (this.state.status === "ended") {
      // If there are winners, pick one randomly (or first)
      // If tie, pick first player as fallback
      const winnerId =
        this.state.results?.winners.length > 0
          ? this.state.results.winners[
              Math.floor(Math.random() * this.state.results.winners.length)
            ]
          : this.players[0]?.id || "";

      return {
        winnerId,
        stats: {
          question: this.state.question,
          results: this.state.results,
          totalVotes: this.state.votes.size,
        },
      };
    }

    return null;
  }

  reset(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.state = {
      question: null,
      votes: new Map(),
      status: "waiting",
      voteCountdown: 0,
    };
  }
}


