# Development Guide - Multiplayer Mini-Games

## Table of Contents

1. [Project Setup](#project-setup)
2. [Architecture Overview](#architecture-overview)
3. [Coding Standards](#coding-standards)
4. [Adding New Games](#adding-new-games)
5. [State Management](#state-management)
6. [Testing Strategy](#testing-strategy)
7. [Deployment](#deployment)
8. [Common Pitfalls](#common-pitfalls)

---

## Project Setup

### Actual Project Structure

This is a pnpm-based monorepo. The folders are `minigames-frontend/`, `minigames-backend/`,
and `shared/` (note: not `client/`/`server/`).

```
multiplayer-minigames/
├── minigames-frontend/     # Frontend application (React + Vite)
│   ├── src/
│   │   ├── assets/
│   │   ├── components/     # Reusable UI components (Lobby, Landing, etc.)
│   │   ├── games/          # Mini-game UI components (one folder per game)
│   │   ├── hooks/          # Custom React hooks (useSocket)
│   │   ├── services/       # Socket.IO service
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── minigames-backend/      # Backend application (Node.js + Socket.IO)
│   ├── src/
│   │   ├── games/          # Game logic (server-side) + registry.ts
│   │   ├── managers/       # Lobby and game managers
│   │   ├── events.ts       # Socket.IO event handlers
│   │   └── index.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                 # Shared code (imported via relative paths)
│   ├── types/              # Common type definitions (player, lobby, game, events)
│   └── constants/          # Shared constants (colors, game)
│
├── .cursor/                # Cursor rules & commands (AI-assisted workflows)
│   ├── rules/
│   └── commands/
│
├── package.json            # Root scripts (install/dev/build orchestration)
├── PROJECT-SPEC.md
├── DEVELOPMENT-GUIDE.md
└── README.md
```

> Types/constants from `shared/` are imported with relative paths, e.g.
> `import { MiniGameEngine } from "../../../shared/types";`. There is no `shared/validators/`
> folder yet, and the backend reads its types from `shared/` (no `minigames-backend/src/types/`).

### Setup Commands

The project already exists, so day-to-day setup just installs dependencies via the root scripts.

```bash
# Install all dependencies (backend + frontend) from the repo root
pnpm install:all

# Run the apps in two terminals
pnpm dev:backend     # nodemon + ts-node, backend on :3001
pnpm dev:frontend    # Vite dev server

# Build everything
pnpm build:all       # build:backend (tsc) + build:frontend (tsc -b && vite build)
```

---

## Architecture Overview

### Communication Flow

```
Client                     Server
  |                          |
  |--- join_lobby ---------->|  (validate code)
  |<-- lobby_joined ---------|  (send lobby state)
  |                          |
  |--- start_game ---------->|  (host only)
  |<-- game_started ---------|  (broadcast to lobby)
  |                          |
  |--- game_action --------->|  (validate & process)
  |<-- game_state_update ----|  (broadcast new state)
  |                          |
  |--- disconnect ---------->|  (cleanup)
```

### Key Principles

1. **Server Authority**: Server validates all actions and is source of truth
2. **Event-Driven**: All communication via Socket.IO events
3. **Room-Based**: Each lobby is a Socket.IO room for efficient broadcasting
4. **Type-Safe**: Shared types between client and server
5. **Modular Games**: Each game is a plugin with standard interface

---

## Coding Standards

### TypeScript Guidelines

#### Use Strict Mode

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### Never Use `any` Type

**Rule**: Always avoid using the `any` type. It defeats the purpose of TypeScript's type safety.

**Alternatives to `any`:**

1. **Use `unknown`** for values with truly unknown types that require runtime checking:

```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
function processData(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value: string }).value;
  }
  throw new Error("Invalid data");
}
```

2. **Define proper interfaces** for object structures:

```typescript
// ❌ Bad
const gameState: any = { status: "ready", score: 0 };

// ✅ Good
interface GameState {
  status: string;
  score: number;
}
const gameState: GameState = { status: "ready", score: 0 };
```

3. **Use generic types** for flexible but type-safe code:

```typescript
// ❌ Bad
function getFirst(arr: any[]): any {
  return arr[0];
}

// ✅ Good
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

4. **Use union types** for multiple possible types:

```typescript
// ❌ Bad
function formatValue(value: any): string {
  return String(value);
}

// ✅ Good
function formatValue(value: string | number | boolean): string {
  return String(value);
}
```

5. **Use index signatures** for dynamic object keys:

```typescript
// ❌ Bad
const stats: any = {};

// ✅ Good
const stats: Record<string, number> = {};
// or
const stats: { [key: string]: number } = {};
```

**Only Exception**: When interfacing with third-party libraries that have incorrect or missing types, you may use `any` with an explicit ESLint disable comment explaining why:

```typescript
// Type assertion needed due to Socket.IO's dynamic typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(this.socket.emit as any)(event, ...args);
```

#### Define Clear Types

```typescript
// shared/types/lobby.ts
export interface Player {
  id: string;
  username: string;
  color: string;
  score: number;
  isHost: boolean;
  isSpectator: boolean;
}

export interface Lobby {
  code: string;
  hostId: string;
  players: Player[];
  config: LobbyConfig;
  status: "waiting" | "in_game" | "finished";
}

export interface LobbyConfig {
  pointsToWin: number;
  selectedGames: string[];
  maxPlayers?: number;
  isPrivate: boolean;
}
```

#### Use Discriminated Unions for Events

```typescript
// shared/types/events.ts
export type ClientToServerEvents = {
  create_lobby: (data: { username: string; color: string }) => void;
  join_lobby: (data: { code: string; username: string; color: string }) => void;
  start_game: () => void;
  game_action: (action: GameAction) => void;
};

export type ServerToClientEvents = {
  lobby_created: (lobby: Lobby) => void;
  lobby_joined: (lobby: Lobby) => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string) => void;
  game_started: (gameData: GameStartData) => void;
  game_state_update: (state: GameState) => void;
  round_ended: (result: RoundResult) => void;
  game_ended: (winner: Player) => void;
  error: (error: { message: string }) => void;
};
```

### Code Style

#### Use Consistent Naming

- **PascalCase**: Components, Classes, Types, Interfaces
- **camelCase**: Variables, functions, methods
- **UPPER_SNAKE_CASE**: Constants
- **kebab-case**: File names (components can be PascalCase)

```typescript
// Good
const MAX_PLAYERS = 8;
const playerScore = 0;
class LobbyManager {}
interface GameState {}

// Bad
const max_players = 8;
const PlayerScore = 0;
class lobbyManager {}
interface gamestate {}
```

#### Prefer Functional Components and Composition

```typescript
// Good - Functional component with hooks
export const Lobby: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const { sendEvent } = useSocket();

  return <div>{/* ... */}</div>;
};

// Avoid - Class components (unless needed)
export class Lobby extends React.Component {
  // ...
}
```

---

## Adding New Games

### Step-by-Step Guide

#### 1. Game Interface (Already Defined)

The shared game interface already exists in `shared/types/game.ts`. New games must implement it
as-is — no `any` is used anywhere:

```typescript
// shared/types/game.ts (existing)
export interface MiniGameConfig {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: number; // in seconds
}

// Generic game state - games can have different state structures
export interface GameState {
  status: string;
  [key: string]: unknown;
}

export interface GameStats {
  [key: string]: unknown;
}

export interface GameAction {
  type: string;
  payload?: unknown;
}

export interface RoundEndResult {
  winnerId: string;
  stats: GameStats;
}

export interface MiniGameEngine {
  config: MiniGameConfig;
  initialize(players: Player[]): void;
  handleAction(playerId: string, action: GameAction): void;
  getState(): GameState;
  checkRoundEnd(): RoundEndResult | null;
  reset(): void;
}
```

#### 2. Create Server-Side Game Logic

```typescript
// minigames-backend/src/games/reaction-time.ts
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
  estimatedDuration: 15,
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

    // Schedule green light after random delay
    const delay = 2000 + Math.random() * 3000; // 2-5 seconds
    this.greenTimeout = setTimeout(() => {
      this.state.status = "green";
      this.state.greenTime = Date.now();
    }, delay);
  }

  handleAction(playerId: string, action: GameAction): void {
    if (action.type !== "click") return;
    if (this.state.status !== "green") {
      // Clicked too early - penalize
      this.state.responses.set(playerId, -1);
      return;
    }
    if (this.state.responses.has(playerId)) return; // Already clicked

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
    // End when all players responded or timeout
    if (this.state.responses.size < this.players.length) {
      // Check timeout (e.g., 2 seconds after green)
      if (this.state.greenTime && Date.now() - this.state.greenTime > 2000) {
        return this.determineWinner();
      }
      return null;
    }
    return this.determineWinner();
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

    return {
      winnerId: fastestPlayerId || this.players[0].id, // Fallback
      stats: {
        responses: Array.from(this.state.responses.entries()),
        winner: { id: fastestPlayerId, time: fastestTime },
      },
    };
  }

  reset(): void {
    if (this.greenTimeout) clearTimeout(this.greenTimeout);
    this.state = {
      startTime: null,
      greenTime: null,
      responses: new Map(),
      status: "waiting",
    };
  }
}
```

#### 3. Register Game

```typescript
// minigames-backend/src/games/registry.ts
import { ReactionTimeGame } from "./reaction-time";
import { WouldYouRatherGame } from "./would-you-rather";
import { MiniGameEngine, Player, MiniGameConfig } from "../../../shared/types";

type GameConstructor = new () => MiniGameEngine;

export const GAME_REGISTRY: Record<string, GameConstructor> = {
  reaction_time: ReactionTimeGame,
  would_you_rather: WouldYouRatherGame,
  // Add more games here
};

export function getAvailableGames(): MiniGameConfig[] {
  return Object.values(GAME_REGISTRY).map(
    (GameClass) => new GameClass().config
  );
}

export function createGame(gameId: string, players: Player[]): MiniGameEngine {
  const GameClass = GAME_REGISTRY[gameId];
  if (!GameClass) {
    throw new Error(`Game ${gameId} not found`);
  }

  const game = new GameClass();
  game.initialize(players);
  return game;
}
```

#### 4. Create Client-Side Component

Each game lives in its own folder: `minigames-frontend/src/games/<game-id>/index.tsx`
(plus a `styles.css`). Components receive `gameState` (typed as `unknown`, then narrowed
to the game's own state interface) and an `onAction` callback — they do NOT call `useSocket`
directly.

```typescript
// minigames-frontend/src/games/reaction-time/index.tsx
import { useState } from "react";
import type { GameAction } from "../../../shared/types";
import "./styles.css";

interface ReactionTimeState {
  status: string;
}

interface ReactionTimeProps {
  gameState: unknown;
  onAction: (action: GameAction) => void;
}

export function ReactionTime({ gameState, onAction }: ReactionTimeProps) {
  const state = gameState as ReactionTimeState | null;
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    onAction({ type: "click" });
  };

  const getBackgroundColor = () => {
    switch (state?.status) {
      case "ready":
        return "red";
      case "green":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <div
      className="reaction-game"
      style={{ backgroundColor: getBackgroundColor(), height: "100vh" }}
      onClick={handleClick}
    >
      <h1>{state?.status === "ready" ? "Wait..." : "Click Now!"}</h1>
      {clicked && <p>Clicked!</p>}
    </div>
  );
}
```

#### 5. Wire the Component into `App.tsx`

There is no `GAME_COMPONENTS` map. Games are imported and rendered with an explicit
`gameId` check inside the "Show game if in progress" block of
`minigames-frontend/src/App.tsx`:

```typescript
// minigames-frontend/src/App.tsx
import { ReactionTime } from "./games/reaction-time";
import { WouldYouRather } from "./games/would-you-rather";
// import { YourNewGame } from "./games/your-new-game";

// ...inside App(), where the game is rendered:
if (gameData && gameState && lobby?.status === "in_game") {
  if (gameData.gameId === "reaction_time") {
    return <ReactionTime gameState={gameState} onAction={sendGameAction} />;
  }
  if (gameData.gameId === "would_you_rather") {
    return <WouldYouRather gameState={gameState} onAction={sendGameAction} />;
  }
  // Add a new branch here for your game's gameId
}
```

#### 6. Document the Completed Game in `jogos-feitos.md`

When implementation is done, **move** the game's entry from `jogos-pra-criar.md` to
`jogos-feitos.md` (newest at the top). The completed entry must include:

- The full spec from the backlog (rules, actions, server logic, UI)
- **Skippable wait times** — document what was actually implemented
- **Completion date** (`YYYY-MM-DD`)
- **Files touched** — backend engine, frontend folder, `registry.ts`, `App.tsx`

Use the template in `jogos-feitos.md` as reference. Do not leave implemented games
undocumented — `jogos-feitos.md` is the catalog of how each shipped game works.

### Skippable Wait Times (Required)

Every new game **must** let players skip idle waiting. Long fixed timers make rounds feel
sluggish (e.g. vote countdowns plus multi-second result screens). Players who already acted
should never be stuck watching a clock.

**What must be skippable:**

- Countdown timers (voting, answering, etc.) — end early when all players have acted
- "Waiting for others…" phases after a player has submitted their action
- Results / reveal / score screens before the next round
- Any other non-interactive pause between phases

**What is not a skippable wait** (core gameplay, not idle time):

- Random delays that are part of the mechanic (e.g. Reaction Time's unpredictable green light)
- The active window in which a player must perform an action (the timer itself is the challenge)

**Implementation pattern:**

1. **Server-side authority** — skipping advances the phase in `handleAction`; never advance
   state from the client alone.
2. **`GameAction` for skip** — e.g. `type: "skip"` or `type: "skip_phase"`. Handle it in the
   engine and clear any `setInterval` / `setTimeout` tied to the current phase.
3. **Early end when everyone is done** — if all players voted/answered, call the same
   `endVoting()` (or equivalent) immediately instead of waiting for the countdown.
4. **UI** — show a visible **Skip** / **Pular** button during skippable phases. Disable it
   while the player still needs to act (e.g. hasn't voted yet). Optionally show "X/Y ready"
   when waiting on others.
5. **Results screens** — keep a short default display (2–5s) but always allow skip to
   `ended` / next round.

```typescript
// Example: handle skip in the server engine
handleAction(playerId: string, action: GameAction): void {
  if (action.type === "skip") {
    if (this.state.status === "results") {
      this.advanceToEnded(); // clears resultsTimeout
    }
    return;
  }
  // ... other actions
}

// Example: end voting early when everyone voted
private onVote(playerId: string, choice: VoteChoice): void {
  this.state.votes.set(playerId, choice);
  if (this.state.votes.size >= this.players.length) {
    this.endVoting();
  }
}
```

When specifying a new game in `jogos-pra-criar.md`, list every timed phase and how it can
be skipped (button, all-players-done, or both).

### Best Practices for Game Development

1. **Keep Logic Server-Side**: Never trust client for game outcomes
2. **Skippable Waits**: No mandatory idle timers — see [Skippable Wait Times](#skippable-wait-times-required)
3. **Deterministic When Possible**: Same inputs = same outputs
4. **Handle Edge Cases**: Disconnects, timeouts, early/late actions
5. **Clear Win Conditions**: Obvious who won and why
6. **Test with Multiple Players**: Ensure fairness
7. **Optimize State Updates**: Only send what changed
8. **Add Comments**: Explain game rules in code

---

## State Management

### Socket.IO Service Pattern

```typescript
// minigames-frontend/src/services/socket.ts
import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../../shared/types";

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;

  connect(url: string) {
    this.socket = io(url);
    return this.socket;
  }

  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) {
    this.socket?.emit(event, ...args);
  }

  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) {
    this.socket?.on(event, handler as any);
  }

  off<K extends keyof ServerToClientEvents>(event: K) {
    this.socket?.off(event);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();
```

### Custom Hook Pattern

```typescript
// minigames-frontend/src/hooks/useSocket.ts
import { useEffect, useState } from "react";
import { socketService } from "../services/socket";
import { Lobby } from "../../../shared/types";

export const useSocket = () => {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socketService.connect("http://localhost:3001");

    socketService.on("lobby_joined", (lobbyData) => {
      setLobby(lobbyData);
    });

    socketService.on("error", ({ message }) => {
      setError(message);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  return {
    lobby,
    error,
    createLobby: (username: string, color: string) => {
      socketService.emit("create_lobby", { username, color });
    },
    joinLobby: (code: string, username: string, color: string) => {
      socketService.emit("join_lobby", { code, username, color });
    },
  };
};
```

### Server State Management

```typescript
// minigames-backend/src/managers/lobby-manager.ts
import { Lobby, Player, LobbyConfig } from "../../../shared/types";

class LobbyManager {
  private lobbies = new Map<string, Lobby>();

  createLobby(hostId: string, config: LobbyConfig): Lobby {
    const code = this.generateCode();
    const lobby: Lobby = {
      code,
      hostId,
      players: [],
      config,
      status: "waiting",
    };
    this.lobbies.set(code, lobby);
    return lobby;
  }

  getLobby(code: string): Lobby | undefined {
    return this.lobbies.get(code);
  }

  addPlayer(code: string, player: Player): Lobby | null {
    const lobby = this.lobbies.get(code);
    if (!lobby) return null;

    lobby.players.push(player);
    return lobby;
  }

  removeLobby(code: string): void {
    this.lobbies.delete(code);
  }

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

export const lobbyManager = new LobbyManager();
```

---

## Testing Strategy

> Note: No automated test runner is configured yet (there is no `test` script and no Jest/Vitest
> dependency in either workspace). The examples below are the target patterns — you'll need to add
> a runner (e.g. Vitest) before they can run. Until then, rely on the Manual Testing Checklist.

### Unit Tests

Test game logic in isolation:

```typescript
// minigames-backend/src/games/__tests__/reaction-time.test.ts
import { ReactionTimeGame } from "../reaction-time";

describe("ReactionTimeGame", () => {
  it("should initialize with correct state", () => {
    const game = new ReactionTimeGame();
    const players = [
      {
        id: "1",
        username: "Player1",
        color: "red",
        score: 0,
        isHost: true,
        isSpectator: false,
      },
      {
        id: "2",
        username: "Player2",
        color: "blue",
        score: 0,
        isHost: false,
        isSpectator: false,
      },
    ];

    game.initialize(players);
    const state = game.getState();

    expect(state.status).toBe("ready");
    expect(state.responses).toHaveLength(0);
  });

  it("should determine winner correctly", () => {
    // Test implementation...
  });
});
```

### Integration Tests

Test Socket.IO events:

```typescript
// minigames-backend/src/__tests__/socket.test.ts
import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { createServer } from "../index";

describe("Socket.IO Events", () => {
  let clientSocket: ClientSocket;

  beforeAll((done) => {
    const server = createServer();
    clientSocket = Client("http://localhost:3001");
    clientSocket.on("connect", done);
  });

  afterAll(() => {
    clientSocket.close();
  });

  it("should create lobby", (done) => {
    clientSocket.emit("create_lobby", { username: "Test", color: "red" });
    clientSocket.on("lobby_created", (lobby) => {
      expect(lobby.code).toBeTruthy();
      done();
    });
  });
});
```

### Manual Testing Checklist

- [ ] Create lobby and verify code generation
- [ ] Join lobby with valid/invalid codes
- [ ] Start game with min/max players
- [ ] Complete full game round
- [ ] Skip / early-end every wait phase (countdown, results screen, waiting for others)
- [ ] Test disconnect during game
- [ ] Verify spectator mode triggers correctly
- [ ] Test score accumulation
- [ ] Verify winner detection
- [ ] Test return to lobby

---

## Deployment

### Environment Variables

```bash
# minigames-backend/.env
PORT=3001
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

# minigames-frontend/.env
VITE_API_URL=https://api.yourdomain.com
```

### Production Build

```bash
# Build everything from the repo root
pnpm build:all

# Or build individually
cd minigames-frontend && pnpm build   # tsc -b && vite build
cd ../minigames-backend && pnpm build  # tsc

# Run production backend
cd minigames-backend && pnpm start     # node dist/index.js
```

### Deployment Options

1. **Simple**: Heroku, Railway, Render (all-in-one)
2. **Scalable**: Frontend on Vercel/Netlify, Backend on Railway/Render
3. **Full Control**: VPS (DigitalOcean, AWS EC2) with Docker

### Docker Setup (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

---

## Common Pitfalls

### 1. Race Conditions

**Problem**: Multiple players submit actions simultaneously
**Solution**: Process actions in order, use transactions if needed

### 2. Memory Leaks

**Problem**: Lobbies stay in memory forever
**Solution**: Implement cleanup for inactive lobbies

```typescript
// Clean up lobbies older than 1 hour with no activity
setInterval(() => {
  const now = Date.now();
  lobbies.forEach((lobby, code) => {
    if (now - lobby.lastActivity > 3600000) {
      lobbyManager.removeLobby(code);
    }
  });
}, 600000); // Check every 10 minutes
```

### 3. Client-Side State Desync

**Problem**: Client state differs from server
**Solution**: Server broadcasts authoritative state regularly

### 4. Not Handling Disconnects

**Problem**: Player disconnect breaks game
**Solution**: Implement reconnection logic and game pause

### 5. Security Issues

**Problem**: Client can spoof actions
**Solution**: Validate everything server-side

```typescript
// Bad
socket.on("set_score", (score) => {
  player.score = score; // Client can cheat!
});

// Good
socket.on("game_action", (action) => {
  const result = game.handleAction(player.id, action);
  if (result.scored) {
    player.score++; // Server controls scoring
  }
});
```

---

## Performance Tips

1. **Throttle State Updates**: Don't broadcast on every tiny change
2. **Use Rooms Efficiently**: Socket.IO rooms for isolated lobbies
3. **Minimize Payload Size**: Send only changed data
4. **Lazy Load Games**: Don't load all game code upfront
5. **Connection Pooling**: Reuse connections when possible

---

## Git Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `game/*`: New mini-games

### Commit Messages

```
feat(game): add reaction time mini-game
fix(lobby): correct player count display
refactor(socket): extract event handlers
docs: update development guide
```

---

## Getting Help

### Common Commands Reference

```bash
# Start development (run from the repo root)
pnpm dev:backend     # nodemon + ts-node (backend on :3001)
pnpm dev:frontend    # Vite dev server

# Install everything
pnpm install:all

# Build
pnpm build:all       # backend (tsc) + frontend (tsc -b && vite build)

# Type checking (backend)
cd minigames-backend && pnpm type-check   # tsc --noEmit

# Linting (frontend only)
cd minigames-frontend && pnpm lint        # ESLint

# Testing: no runner configured yet (see Testing Strategy)
```

### Debugging Socket.IO

Add this to see all Socket.IO events:

```typescript
// Client
localStorage.debug = 'socket.io-client:socket';

// Server (from minigames-backend/)
DEBUG=socket.io:* pnpm dev
```

---

## Updating Project Documentation

### When to Update PROJECT-SPEC.md

**Always update the PROJECT-SPEC.md when making**:

1. **Architecture Changes**

   - Adding new communication patterns (e.g., new Socket.IO events)
   - Changing data flow or state management approach
   - Modifying server/client responsibilities
   - Introducing new architectural layers or patterns

2. **Feature Additions**

   - New user-facing features (e.g., lobby list, spectator mode)
   - New game modes or gameplay mechanics
   - Additional configuration options
   - New user interactions or flows

3. **API/Interface Changes**

   - New or modified Socket.IO events
   - Changes to shared types/interfaces
   - Database schema modifications
   - External API integrations

4. **Requirement Changes**
   - Modified technical requirements
   - New dependencies or tools
   - Changes to MVP scope
   - Updated success metrics

### How to Update PROJECT-SPEC.md

1. **Document the Change**: Add a clear description in the relevant section
2. **Update Diagrams**: Modify any affected flow diagrams or architecture visuals
3. **Update Examples**: Include code examples if relevant
4. **Track in Changelog**: Optionally maintain a changelog section
5. **Review Dependencies**: Check if other sections need updates

### Example Update Process

```markdown
## Recent Changes

### [Date] - Feature: Public Lobby List

**Added:**

- New "Lobby List" feature allowing users to browse public lobbies
- Privacy toggle for lobby hosts (Private/Public)
- New events: `get_public_lobbies`, `toggle_lobby_privacy`

**Modified:**

- Lobby interface to include privacy status
- Landing page to include "Browse Lobbies" option

**Files Changed:**

- `shared/types/events.ts`
- `minigames-backend/src/managers/lobby-manager.ts`
- `minigames-frontend/src/components/LobbyList.tsx` (new)
```

### Quick Checklist

Before committing major changes:

- [ ] Updated PROJECT-SPEC.md with new features/architecture
- [ ] Updated DEVELOPMENT-GUIDE.md with new patterns/practices
- [ ] Documented completed games in `jogos-feitos.md` (moved from `jogos-pra-criar.md`)
- [ ] Updated README.md if user-facing changes
- [ ] Added code examples for new patterns
- [ ] Updated type definitions and interfaces
- [ ] Verified all documentation is consistent

---

## Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Game Development Patterns](https://gameprogrammingpatterns.com/)

---

**Remember**: Start simple, test often, and iterate. Build one working mini-game before adding complexity!

**Document as you go**: Keep PROJECT-SPEC.md updated to maintain a single source of truth for the project's architecture and features.
