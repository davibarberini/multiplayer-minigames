import WebSocket, { WebSocketServer } from "ws"; // Import WebSocketServer type
import { v4 as uuidv4 } from "uuid";
import http from "http"; // Import http module
import fs from "fs"; // Import fs module
import path from "path"; // Import path module
import GameManager from "./game_manager";
import { PlayerWebSocket, PlayerInfo, GameDefinition, Lobby } from "./types";

// --- HTTP Server Setup ---
const httpServer = http.createServer((req, res) => {
  // Determine file path based on request URL
  let filePath = req.url ? req.url.split("?")[0] : "/"; // Ignore query params
  if (filePath === "/") {
    filePath = "/index.html";
  }

  // Construct the full path relative to the server location
  // Assume server runs from `dist/`, so client is `../client/`
  const fullPath = path.join(__dirname, "..", "../client", filePath);
  const extname = path.extname(fullPath);
  let contentType = "text/html"; // Default

  switch (extname) {
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
      contentType = "image/jpg";
      break;
  }

  fs.readFile(fullPath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        // File not found
        console.log(`HTTP Server: 404 - File not found: ${fullPath}`);
        fs.readFile(
          path.join(__dirname, "..", "../client", "404.html"),
          (error404, content404) => {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end(content404 || "404 Not Found", "utf-8");
          }
        );
      } else {
        // Some other server error
        console.error(`HTTP Server: Error reading file ${fullPath}: ${error}`);
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // File found, serve it
      console.log(`HTTP Server: 200 - Serving: ${fullPath}`);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

// --- WebSocket Server Setup (attach to HTTP server) ---
// const wss = new WebSocketServer({ port: 8080 }); // OLD
const wss = new WebSocketServer({ server: httpServer }); // NEW: Attach to HTTP server

// Define types for our main data stores
interface LobbiesMap {
  [lobbyCode: string]: Lobby;
}
interface PlayerLobbiesMap {
  [clientId: string]: string;
}
interface PlayersMap {
  [clientId: string]: PlayerInfo;
}
interface AvailableGamesMap {
  [gameId: string]: GameDefinition;
}

const lobbies: LobbiesMap = {};
const playerLobbies: PlayerLobbiesMap = {};
const players: PlayersMap = {};

const availableGames: AvailableGamesMap = {
  spaceDuel: { name: "Space Duel", minPlayers: 2, maxPlayers: 2 },
};

console.log("WebSocket server started on port 8080");

wss.on("connection", (ws: WebSocket) => {
  // Type assertion to add our custom property
  const playerWs = ws as PlayerWebSocket;
  playerWs.clientId = uuidv4();

  players[playerWs.clientId] = {
    ws: playerWs,
    name: `Anon_${playerWs.clientId.substring(0, 4)}`,
    id: playerWs.clientId,
  };
  console.log(`Client connected: ${playerWs.clientId}`);

  playerWs.send(
    JSON.stringify({
      type: "yourInfo",
      payload: { clientId: playerWs.clientId },
    })
  );

  playerWs.on("message", (messageBuffer) => {
    // Ensure message is treated as string
    const messageString = messageBuffer.toString();
    try {
      const data = JSON.parse(messageString);
      console.log(`Received message from ${playerWs.clientId}:`, data);

      const playerInfo = players[playerWs.clientId];
      if (!playerInfo) {
        console.error(
          `Received message from unknown client ID: ${playerWs.clientId}`
        );
        return;
      }

      // Type check for incoming data can be added here
      if (
        typeof data !== "object" ||
        data === null ||
        typeof data.type !== "string"
      ) {
        sendError(playerWs, "Invalid message structure.");
        return;
      }

      if (data.type === "gameAction") {
        const lobbyCode = playerLobbies[playerWs.clientId];
        if (lobbyCode) {
          // Type assertion for payload could be more specific if needed
          GameManager.handleGameAction(
            lobbyCode,
            playerWs.clientId,
            data.payload as any
          );
        } else {
          sendError(playerWs, "Not in a lobby/game.");
        }
        return;
      }

      switch (data.type) {
        case "setPlayerInfo":
          if (data.payload && typeof data.payload.name === "string") {
            playerInfo.name = data.payload.name || playerInfo.name;
            console.log(
              `Client ${playerWs.clientId} set name to: ${playerInfo.name}`
            );
            // Optional confirmation
            // playerWs.send(JSON.stringify({ type: 'infoUpdated', payload: { name: playerInfo.name } }));
          } else {
            sendError(playerWs, "Invalid payload for setPlayerInfo.");
          }
          break;
        case "createLobby":
          handleCreateLobby(playerInfo, data.payload as any); // Add type assertion or validation
          break;
        case "joinLobby":
          handleJoinLobby(playerInfo, data.payload as any); // Add type assertion or validation
          break;
        case "getLobbies":
          sendLobbyList(playerInfo.ws);
          break;
        case "startGame":
          handleStartGame(playerInfo, data.payload as any); // Add type assertion or validation
          break;
        default:
          console.log(`Unknown message type: ${data.type}`);
          sendError(playerWs, "Unknown message type");
      }
    } catch (error) {
      console.error(
        `Failed to parse message or handle request for ${playerWs.clientId}:`,
        error
      );
      // Use type assertion for error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid message format or server error";
      sendError(playerWs, errorMessage);
    }
  });

  playerWs.on("close", () => {
    console.log(`Client disconnected: ${playerWs.clientId}`);
    const lobbyCode = playerLobbies[playerWs.clientId];
    if (lobbyCode) {
      GameManager.handlePlayerDisconnect(lobbyCode, playerWs.clientId);
    }
    handleDisconnect(playerWs.clientId);
    delete players[playerWs.clientId];
  });

  playerWs.on("error", (error) => {
    console.error(`WebSocket error for client ${playerWs.clientId}: ${error}`);
    const lobbyCode = playerLobbies[playerWs.clientId];
    if (lobbyCode) {
      GameManager.handlePlayerDisconnect(lobbyCode, playerWs.clientId);
    }
    handleDisconnect(playerWs.clientId);
    delete players[playerWs.clientId];
  });
});

function generateLobbyCode(): string {
  let code: string;
  do {
    code = Math.random().toString().slice(2, 8);
  } while (lobbies[code]);
  return code;
}

// Define payload types for handlers
interface CreateLobbyPayload {
  lobbyName?: string;
  gameType: string;
}
interface JoinLobbyPayload {
  lobbyCode: string;
}
interface StartGamePayload {
  lobbyCode: string;
}

function handleCreateLobby(
  playerInfo: PlayerInfo,
  payload: CreateLobbyPayload
): void {
  const { ws, id: clientId, name: playerName } = playerInfo;

  if (playerLobbies[clientId]) {
    sendError(ws, "You are already in a lobby.");
    return;
  }

  const lobbyName = payload?.lobbyName || `${playerName}'s Lobby`;
  const requestedGameType = payload?.gameType;

  if (!requestedGameType || !availableGames[requestedGameType]) {
    sendError(ws, `Invalid game type: ${requestedGameType}`);
    return;
  }
  const selectedGame = availableGames[requestedGameType];
  const lobbyCode = generateLobbyCode();

  const newLobby: Lobby = {
    players: [playerInfo],
    host: playerInfo,
    hostId: clientId,
    name: lobbyName,
    code: lobbyCode,
    gameType: requestedGameType,
    maxPlayers: selectedGame.maxPlayers,
    isPublic: true,
  };
  lobbies[lobbyCode] = newLobby;
  playerLobbies[clientId] = lobbyCode;

  console.log(
    `Lobby created by ${clientId} (${playerName}): ${lobbyCode} (${lobbyName}), Game: ${selectedGame.name}, Max Players: ${selectedGame.maxPlayers}`
  );

  ws.send(
    JSON.stringify({
      type: "lobbyCreated",
      payload: {
        lobbyCode: newLobby.code,
        lobbyName: newLobby.name,
        gameType: newLobby.gameType,
        isHost: true,
        hostId: newLobby.hostId,
        players: mapPlayersForClient(newLobby.players),
        maxPlayers: newLobby.maxPlayers,
      },
    })
  );

  broadcastLobbyListUpdate();
}

function handleJoinLobby(
  playerInfo: PlayerInfo,
  payload: JoinLobbyPayload
): void {
  const { ws, id: clientId, name: playerName } = playerInfo;
  const { lobbyCode } = payload;

  if (!lobbyCode) {
    sendError(ws, "Lobby code required.");
    return;
  }

  const lobby = lobbies[lobbyCode];

  if (playerLobbies[clientId]) {
    sendError(ws, "You are already in a lobby.");
    return;
  }

  if (!lobby) {
    sendError(ws, "Lobby not found.");
    return;
  }

  if (!lobby.isPublic) {
    sendError(ws, "Lobby is private or already in game.");
    return;
  }

  if (lobby.players.length >= lobby.maxPlayers) {
    sendError(ws, "Lobby is full.");
    return;
  }

  lobby.players.push(playerInfo);
  playerLobbies[clientId] = lobbyCode;
  console.log(`Client ${clientId} (${playerName}) joined lobby ${lobbyCode}`);

  const currentPlayers = mapPlayersForClient(lobby.players);

  ws.send(
    JSON.stringify({
      type: "lobbyJoined",
      payload: {
        lobbyCode: lobby.code,
        lobbyName: lobby.name,
        gameType: lobby.gameType,
        isHost: false,
        hostId: lobby.hostId,
        players: currentPlayers,
        maxPlayers: lobby.maxPlayers,
      },
    })
  );

  // Notify other players
  lobby.players.forEach((pInfo) => {
    if (pInfo.id !== clientId) {
      pInfo.ws.send(
        JSON.stringify({
          type: "playerJoined",
          payload: {
            player: { id: clientId, name: playerName }, // Send info of the new player
            players: currentPlayers, // Send the full updated list
            hostId: lobby.hostId,
          },
        })
      );
    }
  });

  broadcastLobbyListUpdate();
}

function handleDisconnect(clientId: string): void {
  const lobbyCode = playerLobbies[clientId];
  const disconnectedPlayerInfo = players[clientId]; // Should exist if clientId is valid

  if (lobbyCode && lobbies[lobbyCode]) {
    const lobby = lobbies[lobbyCode];

    // Let GameManager handle game state, we focus on lobby state
    const wasInLobby = lobby.players.some((p) => p.id === clientId);
    lobby.players = lobby.players.filter((p) => p.id !== clientId);
    delete playerLobbies[clientId];

    if (wasInLobby) {
      console.log(
        `Lobby ${lobbyCode}: Player ${clientId} (${
          disconnectedPlayerInfo?.name || "Anon"
        }) removed.`
      );
    }

    // If lobby becomes empty, delete it (GameManager.endGame is called separately on disconnect/error)
    if (lobby.players.length === 0) {
      delete lobbies[lobbyCode];
      console.log(`Lobby ${lobbyCode}: Deleted.`);
      // GameManager.endGame(lobbyCode); // Called elsewhere
      if (lobby.isPublic) broadcastLobbyListUpdate(); // Update list if it was public
    } else {
      // If host disconnected, assign new host
      if (lobby.hostId === clientId) {
        lobby.host = lobby.players[0]; // Assign first player
        lobby.hostId = lobby.host.id;
        console.log(
          `Lobby ${lobbyCode}: New host ${lobby.hostId} (${lobby.host.name})`
        );
        // Notify new host and others
        lobby.host.ws.send(
          JSON.stringify({
            type: "updateLobby",
            payload: { isHost: true, hostId: lobby.hostId },
          })
        );
      }

      // Notify remaining players
      const currentPlayers = mapPlayersForClient(lobby.players);
      lobby.players.forEach((pInfo) => {
        pInfo.ws.send(
          JSON.stringify({
            type: "playerLeft",
            payload: {
              clientId: clientId,
              players: currentPlayers,
              hostId: lobby.hostId,
            },
          })
        );
      });
      // Update list if public
      if (lobby.isPublic) broadcastLobbyListUpdate();
    }
  }
  // Note: GameManager.handlePlayerDisconnect is called independently
}

function sendLobbyList(ws: PlayerWebSocket): void {
  const lobbyListData = Object.values(lobbies)
    .filter((lobby) => lobby.isPublic)
    .map((lobby) => ({
      code: lobby.code,
      name: lobby.name,
      gameType: lobby.gameType,
      playerCount: lobby.players.length,
      maxPlayers: lobby.maxPlayers,
    }));
  ws.send(JSON.stringify({ type: "lobbyList", payload: lobbyListData }));
}

function broadcastLobbyListUpdate(): void {
  const lobbyListData = Object.values(lobbies)
    .filter((lobby) => lobby.isPublic)
    .map((lobby) => ({
      code: lobby.code,
      name: lobby.name,
      gameType: lobby.gameType,
      playerCount: lobby.players.length,
      maxPlayers: lobby.maxPlayers,
    }));
  const message = JSON.stringify({ type: "lobbyList", payload: lobbyListData });

  Object.values(players).forEach((pInfo) => {
    if (pInfo.ws.readyState === WebSocket.OPEN && !playerLobbies[pInfo.id]) {
      pInfo.ws.send(message);
    }
  });
  console.log("Broadcasted lobby list update");
}

// Helper to format player list for sending to client
interface ClientPlayerInfo {
  id: string;
  name: string;
}
function mapPlayersForClient(
  playerInfoArray: PlayerInfo[]
): ClientPlayerInfo[] {
  return playerInfoArray.map((pInfo) => ({ id: pInfo.id, name: pInfo.name }));
}

function handleStartGame(
  playerInfo: PlayerInfo,
  payload: StartGamePayload
): void {
  const { ws, id: clientId } = playerInfo;
  const { lobbyCode } = payload;

  if (!lobbyCode) {
    sendError(ws, "Lobby code required.");
    return;
  }
  const lobby = lobbies[lobbyCode];

  if (!lobby) {
    sendError(ws, "Lobby not found.");
    return;
  }
  if (lobby.hostId !== clientId) {
    sendError(ws, "Only the host can start the game.");
    return;
  }

  const selectedGame = availableGames[lobby.gameType];
  if (!selectedGame) {
    sendError(ws, "Selected game type is invalid.");
    console.error(
      `Attempted to start invalid game type ${lobby.gameType} in lobby ${lobbyCode}`
    );
    return;
  }

  if (lobby.players.length < selectedGame.minPlayers) {
    sendError(
      ws,
      `Not enough players to start ${selectedGame.name}. Need ${selectedGame.minPlayers}.`
    );
    return;
  }

  console.log(
    `Host ${clientId} is starting game ${lobby.gameType} in lobby ${lobbyCode}`
  );

  lobby.isPublic = false;
  broadcastLobbyListUpdate();

  const gameInstance = GameManager.createGame(
    lobby.gameType,
    lobby.code,
    lobby.players
  );

  if (!gameInstance) {
    console.error(
      `Failed to create game instance for ${lobby.gameType} in lobby ${lobbyCode}`
    );
    sendError(ws, "Failed to initialize the game on the server."); // Notify host
    // Revert lobby state?
    lobby.isPublic = true;
    broadcastLobbyListUpdate();
    return;
  }
  // Game instance now handles sending the initial state upon creation.
}

// Helper to send error messages
function sendError(ws: PlayerWebSocket, message: string): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "error", payload: message }));
  }
}

// --- Start the HTTP Server ---
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(
    `HTTP server started on port ${PORT}. WebSocket server is attached.`
  );
});
