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

### Recommended Project Structure

```
multiplayer-minigames/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── games/         # Mini-game implementations
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API and Socket.IO service
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Helper functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                # Backend application
│   ├── src/
│   │   ├── games/         # Game logic (server-side)
│   │   ├── managers/      # Lobby and game managers
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Helper functions
│   │   ├── events.ts      # Socket.IO event handlers
│   │   └── index.ts       # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                # Shared code between client/server
│   ├── types/             # Common type definitions
│   ├── constants/         # Shared constants
│   └── validators/        # Shared validation logic
│
├── PROJECT-SPEC.md
├── DEVELOPMENT-GUIDE.md
└── README.md
```

### Initial Setup Commands

```bash
# Create project structure
mkdir -p client/src/{components,games,hooks,services,types,utils}
mkdir -p server/src/{games,managers,types,utils}
mkdir -p shared/{types,constants,validators}

# Initialize client (React + TypeScript + Vite)
cd client
npm create vite@latest . -- --template react-ts
npm install socket.io-client
npm install -D @types/node

# Initialize server (Node.js + TypeScript)
cd ../server
npm init -y
npm install express socket.io cors
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon
npx tsc --init

# Update server tsconfig.json
# Set: "target": "ES2022", "module": "commonjs", "outDir": "./dist"
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
  gameMode: string | "random";
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

#### 1. Define Game Interface (First Time Only)

```typescript
// shared/types/game.ts
export interface MiniGameConfig {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
}

export interface MiniGameEngine {
  config: MiniGameConfig;
  initialize(players: Player[]): void;
  handleAction(playerId: string, action: any): void;
  getState(): any;
  checkRoundEnd(): RoundEndResult | null;
  reset(): void;
}

export interface RoundEndResult {
  winnerId: string;
  stats: Record<string, any>;
}
```

#### 2. Create Server-Side Game Logic

```typescript
// server/src/games/reaction-time.ts
import {
  MiniGameEngine,
  MiniGameConfig,
  RoundEndResult,
  Player,
} from "../../../shared/types/game";

const config: MiniGameConfig = {
  id: "reaction_time",
  name: "Reaction Time",
  description: "Click as fast as you can when the screen turns green!",
  minPlayers: 2,
  maxPlayers: 8,
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

  handleAction(playerId: string, action: any): void {
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

  getState(): any {
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
// server/src/games/registry.ts
import { ReactionTimeGame } from "./reaction-time";
// Import other games...

export const GAME_REGISTRY = {
  reaction_time: ReactionTimeGame,
  // Add more games here
};

export function getAvailableGames() {
  return Object.values(GAME_REGISTRY).map(
    (GameClass) => new GameClass().config
  );
}

export function createGame(gameId: string, players: Player[]) {
  const GameClass = GAME_REGISTRY[gameId];
  if (!GameClass) throw new Error(`Game ${gameId} not found`);

  const game = new GameClass();
  game.initialize(players);
  return game;
}
```

#### 4. Create Client-Side Component

```typescript
// client/src/games/ReactionTime.tsx
import React, { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

interface ReactionTimeProps {
  gameState: any;
}

export const ReactionTime: React.FC<ReactionTimeProps> = ({ gameState }) => {
  const { sendEvent } = useSocket();
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    sendEvent("game_action", { type: "click" });
  };

  const getBackgroundColor = () => {
    switch (gameState.status) {
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
      <h1>{gameState.status === "ready" ? "Wait..." : "Click Now!"}</h1>
      {clicked && <p>Clicked!</p>}
    </div>
  );
};
```

#### 5. Register Component

```typescript
// client/src/games/index.ts
import { ReactionTime } from "./ReactionTime";
// Import other game components...

export const GAME_COMPONENTS: Record<string, React.FC<any>> = {
  reaction_time: ReactionTime,
  // Add more game components
};
```

### Best Practices for Game Development

1. **Keep Logic Server-Side**: Never trust client for game outcomes
2. **Deterministic When Possible**: Same inputs = same outputs
3. **Handle Edge Cases**: Disconnects, timeouts, early/late actions
4. **Clear Win Conditions**: Obvious who won and why
5. **Test with Multiple Players**: Ensure fairness
6. **Optimize State Updates**: Only send what changed
7. **Add Comments**: Explain game rules in code

---

## State Management

### Socket.IO Service Pattern

```typescript
// client/src/services/socket.ts
import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../../shared/types/events";

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
// client/src/hooks/useSocket.ts
import { useEffect, useState } from "react";
import { socketService } from "../services/socket";
import { Lobby } from "../../../shared/types/lobby";

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
// server/src/managers/lobby-manager.ts
import { Lobby, Player, LobbyConfig } from "../../../shared/types/lobby";

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

### Unit Tests

Test game logic in isolation:

```typescript
// server/src/games/__tests__/reaction-time.test.ts
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
// server/src/__tests__/socket.test.ts
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
- [ ] Test disconnect during game
- [ ] Verify spectator mode triggers correctly
- [ ] Test score accumulation
- [ ] Verify winner detection
- [ ] Test return to lobby

---

## Deployment

### Environment Variables

```bash
# server/.env
PORT=3001
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

# client/.env
VITE_API_URL=https://api.yourdomain.com
```

### Production Build

```bash
# Build client
cd client
npm run build

# Build server
cd ../server
npm run build

# Run production server
npm start
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
# Start development
npm run dev          # Client (Vite)
npm run dev          # Server (nodemon + ts-node)

# Type checking
npm run type-check   # Check types without building

# Linting
npm run lint         # ESLint
npm run lint:fix     # Auto-fix issues

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Debugging Socket.IO

Add this to see all Socket.IO events:

```typescript
// Client
localStorage.debug = 'socket.io-client:socket';

// Server
DEBUG=socket.io:* npm run dev
```

---

## Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Game Development Patterns](https://gameprogrammingpatterns.com/)

---

**Remember**: Start simple, test often, and iterate. Build one working mini-game before adding complexity!
