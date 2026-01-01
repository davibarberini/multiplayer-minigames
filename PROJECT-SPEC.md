# Multiplayer Mini-Games - Project Specification

## Overview

A web-based multiplayer mini-games platform where players can create lobbies, join games with codes, and compete in various mini-games with scoring and spectator modes.

---

## Core Features

### 1. Lobby Management

#### Creating a Lobby

- Any user can create a new lobby
- Lobby creator becomes the host
- System generates a unique join code (e.g., 6-character alphanumeric)
- Host has privileges to configure lobby settings

#### Joining a Lobby

- Users can join existing lobbies using a join code
- Lobby displays all connected players
- Real-time updates when players join/leave

### 2. Public Lobby List

#### Browsing Public Lobbies

- Users can view a list of all public lobbies with enhanced visual design
- **High contrast UI** for better readability:
  - White lobby cards with gradient borders on hover
  - Large, gradient-styled lobby codes
  - Color-coded badges for player count
  - Distinct info cards with shadows
- List shows:
  - Lobby code (gradient text, 1.8rem)
  - Current player count / Max players (badge style)
  - Game mode (in highlighted card)
  - Points to win configuration
  - Player avatars (first 4 players + overflow indicator)
- Real-time updates when lobbies are created/deleted
- **Direct join with modal**:
  - Click "Join Lobby" opens modal
  - Modal collects username and color
  - No need to return to landing page
  - Form validation and color picker
  - Smooth user experience

#### Privacy Settings

- **Private Lobbies** (default):
  - Only accessible via join code
  - Not visible in public lobby list
  - Ideal for playing with friends
- **Public Lobbies**:
  - Visible in the lobby list for all users
  - Anyone can join (until full)
  - Host can toggle between private/public at any time
  - Visual indicator (🔒 Private / 🌐 Public) shows current status

### 3. User Profile System

Each user must configure:

- **Username**: Unique identifier within the lobby
- **Color**: Visual identifier (choose from preset palette or custom)

### 4. Game Selection

#### In-Lobby Game Selection

- Host selects which mini-game to play
- Option to set game mode to "Random"
- Display game metadata:
  - Max players supported
  - Brief description
  - Estimated round duration

#### Random Mode

- Automatically selects mini-games that support current player count
- Ensures no players are forced into spectator mode
- Cycles through available games

### 5. Player Management

#### Spectator Mode

- Triggered when `lobby_players > game_max_players`
- Players who joined last are moved to spectator mode
- Spectators can:
  - View game in real-time
  - See scores and leaderboard
  - Rejoin as active player when slot opens

### 6. Lobby Configuration

Host can configure:

- **Points to Win**: Number of rounds a player must win to win the overall game
- **Game Mode**: Specific game or Random
- **Max Players**: Optional lobby capacity limit
- **Private/Public**: Whether lobby appears in public lobby list

### 7. Scoring System

#### Round-Based Scoring

- Each mini-game round produces a winner
- Winner receives 1 point
- Scores persist across multiple rounds
- Game continues until victory condition met

#### Victory Condition

- First player to reach "Points to Win" wins the overall game
- Victory screen displays winner and final scores
- Option to rematch or return to lobby

#### Post-Victory Flow

- Game returns to lobby
- All players remain connected
- Host can reconfigure and start new game
- Scores reset for new game

---

## Technical Requirements

### Frontend Technology Stack

**Recommended**: React + TypeScript + Socket.IO Client

**Rationale**:

- React: Component-based architecture perfect for modular games
- TypeScript: Type safety for complex game state management
- Socket.IO Client: Industry-standard real-time communication
- Vite: Fast development and build tooling

**Alternative Options**:

- Vue.js + TypeScript (similar benefits, smaller bundle)
- Svelte (lightweight, excellent performance)

### Backend Technology Stack

**Recommended**: Node.js + Express + Socket.IO

**Rationale**:

- Node.js: JavaScript everywhere, single language for full stack
- Express: Minimal overhead, easy to set up
- Socket.IO: Automatic fallback, rooms support, battle-tested
- TypeScript: Shared types between frontend and backend

**Alternative Options**:

- Bun + Hono (faster runtime, but newer ecosystem)
- Deno with socket support (secure by default)

### Database

**Recommended**: Redis (for session storage) + Optional PostgreSQL (for persistence)

**Rationale**:

- Redis: Fast in-memory storage for active lobbies and game state
- PostgreSQL: Optional for storing game history, user stats
- Start without database, add later if needed

---

## Architecture Principles

### 1. Modular Game System

Each mini-game should be:

- **Self-contained**: Independent module with clear interface
- **Declarative**: Defines its requirements (min/max players, duration)
- **Standard Interface**: Implements common game lifecycle methods

#### Game Interface Requirements

```typescript
interface MiniGame {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;

  // Lifecycle methods
  initialize(players: Player[]): GameState;
  handlePlayerAction(action: PlayerAction): GameState;
  checkRoundEnd(): { ended: boolean; winner?: Player };
  reset(): void;
}
```

### 2. State Management

- **Server is source of truth**: All game state lives on server
- **Client validation**: Basic validation on client for UX, authoritative on server
- **Event-driven**: Use Socket.IO events for all state changes

### 3. Scalability Considerations

- Keep game state in memory (fast)
- Use rooms for lobby isolation
- Design for horizontal scaling (future: Redis pub/sub for multi-server)

---

## User Flow

### Complete User Journey

1. **Landing Page**

   - User enters username and selects color
   - Options: Create Lobby or Join Lobby

2. **Lobby Creation** (if Create selected)

   - Generate and display lobby code
   - Wait for other players
   - Configure game settings
   - Start game when ready

3. **Joining Lobby** (if Join selected)

   - Enter lobby code
   - Join existing lobby
   - Wait for host to start game

4. **In-Game**

   - Play mini-game round
   - View scores after round
   - Continue to next round
   - Display victory screen when someone reaches points goal

5. **Post-Game**
   - Return to lobby
   - Option to reconfigure or start new game
   - Players can leave or stay

---

## Mini-Game Requirements

### Each Game Must Implement

1. **Clear Win Condition**: How is a winner determined?
2. **Time Limit**: Maximum round duration
3. **Fair Start**: All players start simultaneously
4. **Spectator View**: Spectators can see the game
5. **Disconnect Handling**: Game continues if player disconnects
6. **Input Validation**: Prevent cheating via client manipulation

### Game Ideas (for Future Implementation)

- **Reaction Time**: First to click wins
- **Trivia**: Answer questions correctly
- **Drawing**: Pictionary-style guessing game
- **Memory**: Memorize sequence and repeat
- **Speed Typing**: Type phrase fastest
- **Quick Math**: Solve equations fastest
- **Color Match**: Match colors under time pressure
- **Rhythm Game**: Hit beats at correct timing

---

## MVP (Phase 1) Scope

### Completed Features ✅

- ✅ Create lobby with code
- ✅ Join lobby with code
- ✅ Set username and color
- ✅ Basic lobby UI with player list
- ✅ Host can start game
- ✅ One simple mini-game (Reaction Time)
- ✅ Round scoring (first to N points)
- ✅ Victory screen
- ✅ Return to lobby
- ✅ **Public lobby list** - Browse and view public lobbies
- ✅ **Privacy toggle** - Hosts can set lobby to private or public

### Phase 2 Features (In Development)

- ✅ **Enhanced lobby list with direct join** - Completed
  - Modal-based username/color collection
  - No need to return to landing
- 🚧 Multiple mini-games
- 🚧 Random game mode

### Phase 3+ Features (Planned)

- ⏸️ Spectator mode
- ⏸️ Persistent stats/history
- ⏸️ Matchmaking system
- ⏸️ Chat system
- ⏸️ Replay system

---

## Recent Changes

### [October 2025] - Enhanced Public Lobby List UI & Direct Join

**Added:**

- Modal-based join flow from lobby list (username + color collection)
- Enhanced visual design for lobby cards with high contrast
- Improved readability with white cards, gradient accents
- Direct join functionality without returning to landing page

**Modified:**

- `LobbyList.tsx`: Added join modal with form and color picker
- `LobbyList.css`: Complete visual redesign with better contrast
- `Landing.css`: Added distinct styling for Browse button
- `App.tsx`: Implemented `handleJoinFromList` function

**UI Improvements:**

- Lobby codes now use gradient text for visual appeal
- Player count badges with colored background
- Info cards with subtle shadows and spacing
- Join buttons with gradient and hover effects
- Modal overlay with backdrop blur

---

## Success Metrics

### Technical Metrics

- Latency: <100ms for player actions
- Support: 2-8 players per lobby
- Stability: No crashes during normal gameplay
- Responsiveness: Works on desktop and mobile

### User Experience Metrics

- Easy lobby creation/joining (< 30 seconds)
- Intuitive game controls
- Clear feedback on all actions
- Smooth state transitions
- **High contrast UI for accessibility**

---

## Future Enhancements

### Potential Features

- Leaderboards (global, per-game)
- User accounts and progression
- Custom game lobbies with rule modifications
- Tournament mode
- Team-based games
- Voice chat integration
- Replay system
- Achievement system
- Cosmetic customization (avatars, effects)
