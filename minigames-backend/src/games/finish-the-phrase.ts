import {
  MiniGameEngine,
  MiniGameConfig,
  RoundEndResult,
  Player,
  GameAction,
  GameState,
} from "../../../shared/types";
import { FTP_PROMPT_KEYS } from "../../../shared/i18n";

const config: MiniGameConfig = {
  id: "finish_the_phrase",
  name: "Finish the Phrase",
  description: "Complete a silly prompt, then vote for the funniest answer!",
  minPlayers: 2,
  maxPlayers: 8,
  estimatedDuration: 45,
};

const WRITE_SECONDS = 20;
const VOTE_SECONDS = 15;
const RESULTS_DISPLAY_MS = 5000;
const MIN_PHRASE_LENGTH = 3;
const MAX_PHRASE_LENGTH = 120;

type GameStatus = "writing" | "voting" | "results" | "ended";

interface DisplayOption {
  displayIndex: number;
  text: string;
}

interface VoteResultEntry {
  playerId: string;
  text: string;
  votes: number;
}

interface FinishThePhraseResults {
  winners: string[];
  entries: VoteResultEntry[];
  noWinner: boolean;
}

interface FinishThePhraseState {
  promptKey: string;
  submissions: Map<string, string>;
  displayOptions: DisplayOption[];
  votes: Map<string, number>;
  status: GameStatus;
  phaseCountdown: number;
  results?: FinishThePhraseResults;
  noWinner: boolean;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class FinishThePhraseGame implements MiniGameEngine {
  config = config;
  private players: Player[] = [];
  private displayIndexToAuthor = new Map<number, string>();
  private state: FinishThePhraseState = {
    promptKey: "",
    submissions: new Map(),
    displayOptions: [],
    votes: new Map(),
    status: "writing",
    phaseCountdown: 0,
    noWinner: false,
  };
  private countdownInterval: NodeJS.Timeout | null = null;
  private resultsTimeout: NodeJS.Timeout | null = null;

  initialize(players: Player[]): void {
    this.players = players;
    const promptKey =
      FTP_PROMPT_KEYS[Math.floor(Math.random() * FTP_PROMPT_KEYS.length)];

    this.state = {
      promptKey,
      submissions: new Map(),
      displayOptions: [],
      votes: new Map(),
      status: "writing",
      phaseCountdown: WRITE_SECONDS,
      noWinner: false,
    };

    this.startCountdown(() => this.endWriting());
  }

  private startCountdown(onExpire: () => void): void {
    this.clearCountdown();
    this.countdownInterval = setInterval(() => {
      this.state.phaseCountdown--;

      if (this.state.phaseCountdown <= 0) {
        onExpire();
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

    if (action.type === "submit") {
      if (this.state.status !== "writing") return;

      const text = (action.payload as string)?.trim();
      if (
        typeof text !== "string" ||
        text.length < MIN_PHRASE_LENGTH ||
        text.length > MAX_PHRASE_LENGTH
      ) {
        return;
      }

      this.state.submissions.set(playerId, text);

      if (this.state.submissions.size >= this.players.length) {
        this.endWriting();
      }
      return;
    }

    if (action.type === "vote") {
      if (this.state.status !== "voting") return;

      const displayIndex = action.payload as number;
      if (typeof displayIndex !== "number" || !Number.isInteger(displayIndex)) {
        return;
      }

      const authorId = this.displayIndexToAuthor.get(displayIndex);
      if (!authorId || authorId === playerId) return;

      this.state.votes.set(playerId, displayIndex);

      if (this.state.votes.size >= this.players.length) {
        this.endVoting();
      }
    }
  }

  private endWriting(): void {
    this.clearCountdown();

    if (this.state.submissions.size === 0) {
      this.state.noWinner = true;
      this.showResults();
      return;
    }

    const entries = Array.from(this.state.submissions.entries()).map(
      ([playerId, text]) => ({ playerId, text })
    );
    const shuffled = shuffleArray(entries);

    this.displayIndexToAuthor.clear();
    this.state.displayOptions = shuffled.map((entry, index) => {
      this.displayIndexToAuthor.set(index, entry.playerId);
      return { displayIndex: index, text: entry.text };
    });

    this.state.status = "voting";
    this.state.phaseCountdown = VOTE_SECONDS;
    this.startCountdown(() => this.endVoting());
  }

  private endVoting(): void {
    this.clearCountdown();
    this.showResults();
  }

  private showResults(): void {
    this.state.status = "results";

    const voteCounts = new Map<string, number>();
    this.state.submissions.forEach((_text, playerId) => {
      voteCounts.set(playerId, 0);
    });

    this.state.votes.forEach((displayIndex) => {
      const authorId = this.displayIndexToAuthor.get(displayIndex);
      if (authorId) {
        voteCounts.set(authorId, (voteCounts.get(authorId) ?? 0) + 1);
      }
    });

    const entries: VoteResultEntry[] = Array.from(
      this.state.submissions.entries()
    ).map(([playerId, text]) => ({
      playerId,
      text,
      votes: voteCounts.get(playerId) ?? 0,
    }));

    entries.sort((a, b) => b.votes - a.votes);

    let maxVotes = 0;
    entries.forEach((entry) => {
      if (entry.votes > maxVotes) maxVotes = entry.votes;
    });

    const winners =
      maxVotes > 0
        ? entries
            .filter((entry) => entry.votes === maxVotes)
            .map((entry) => entry.playerId)
        : [];

    if (winners.length === 0) {
      this.state.noWinner = true;
    }

    this.state.results = {
      winners,
      entries,
      noWinner: this.state.noWinner,
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
    return {
      status: this.state.status,
      promptKey: this.state.promptKey,
      displayOptions: this.state.displayOptions,
      submissions: Array.from(this.state.submissions.entries()),
      votes: Array.from(this.state.votes.entries()),
      phaseCountdown: this.state.phaseCountdown,
      results: this.state.results,
      totalPlayers: this.players.length,
      submittedPlayers: this.state.submissions.size,
      votedPlayers: this.state.votes.size,
      noWinner: this.state.noWinner,
      minPhraseLength: MIN_PHRASE_LENGTH,
      maxPhraseLength: MAX_PHRASE_LENGTH,
    };
  }

  checkRoundEnd(): RoundEndResult | null {
    if (this.state.status !== "ended") {
      return null;
    }

    const results = this.state.results;
    const winnerId =
      results && results.winners.length > 0
        ? results.winners[Math.floor(Math.random() * results.winners.length)]
        : "";

    return {
      winnerId,
      stats: {
        promptKey: this.state.promptKey,
        results: this.state.results,
        noWinner: this.state.noWinner,
        totalSubmissions: this.state.submissions.size,
        totalVotes: this.state.votes.size,
      },
    };
  }

  reset(): void {
    this.clearCountdown();
    if (this.resultsTimeout) {
      clearTimeout(this.resultsTimeout);
      this.resultsTimeout = null;
    }

    this.displayIndexToAuthor.clear();
    this.state = {
      promptKey: "",
      submissions: new Map(),
      displayOptions: [],
      votes: new Map(),
      status: "writing",
      phaseCountdown: 0,
      noWinner: false,
    };
  }
}
