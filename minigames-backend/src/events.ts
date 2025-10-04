import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoundResult,
} from "../../shared/types";
import { lobbyManager } from "./managers/lobby-manager";
import { gameManager } from "./managers/game-manager";
import { createGame, getAvailableGames } from "./games/registry";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupEventHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  io.on("connection", (socket: TypedSocket) => {
    console.log("Client connected:", socket.id);

    // Send available games on connection
    socket.emit("available_games", getAvailableGames());

    // Create lobby
    socket.on("create_lobby", ({ username, color }) => {
      try {
        const lobby = lobbyManager.createLobby(socket.id, username, color);
        socket.join(lobby.code);
        socket.emit("lobby_created", lobby);
        console.log(`Lobby created: ${lobby.code} by ${username}`);
      } catch (error) {
        socket.emit("error", { message: "Failed to create lobby" });
      }
    });

    // Join lobby
    socket.on("join_lobby", ({ code, username, color }) => {
      try {
        const lobby = lobbyManager.getLobby(code);

        if (!lobby) {
          socket.emit("error", { message: "Lobby not found" });
          return;
        }

        if (lobby.status !== "waiting") {
          socket.emit("error", { message: "Game already in progress" });
          return;
        }

        const updatedLobby = lobbyManager.addPlayer(
          code,
          socket.id,
          username,
          color
        );

        if (!updatedLobby) {
          socket.emit("error", { message: "Lobby is full" });
          return;
        }

        socket.join(code);
        socket.emit("lobby_joined", updatedLobby);

        // Notify others in lobby
        const newPlayer = updatedLobby.players.find((p) => p.id === socket.id);
        if (newPlayer) {
          socket.to(code).emit("player_joined", newPlayer);
          socket.to(code).emit("lobby_updated", updatedLobby);
        }

        console.log(`${username} joined lobby: ${code}`);
      } catch (error) {
        socket.emit("error", { message: "Failed to join lobby" });
      }
    });

    // Leave lobby
    socket.on("leave_lobby", () => {
      handlePlayerLeave(socket, io);
    });

    // Start game
    socket.on("start_game", () => {
      try {
        const lobbyCode = getLobbyCodeForSocket(socket);
        if (!lobbyCode) {
          socket.emit("error", { message: "Not in a lobby" });
          return;
        }

        const lobby = lobbyManager.getLobby(lobbyCode);
        if (!lobby) {
          socket.emit("error", { message: "Lobby not found" });
          return;
        }

        if (lobby.hostId !== socket.id) {
          socket.emit("error", { message: "Only host can start game" });
          return;
        }

        if (lobby.players.length < 2) {
          socket.emit("error", { message: "Need at least 2 players" });
          return;
        }

        // Create and start game
        const game = createGame(lobby.config.gameMode as string, lobby.players);
        gameManager.startGame(lobbyCode, game, lobby.players);
        lobbyManager.updateLobbyStatus(lobbyCode, "in_game");

        // Notify all players
        io.to(lobbyCode).emit("game_started", {
          gameId: game.config.id,
          gameName: game.config.name,
          players: lobby.players,
        });

        // Start game state update loop
        startGameLoop(lobbyCode, io);

        console.log(`Game started in lobby: ${lobbyCode}`);
      } catch (error) {
        console.error("Error starting game:", error);
        socket.emit("error", { message: "Failed to start game" });
      }
    });

    // Handle game actions
    socket.on("game_action", (action) => {
      try {
        const lobbyCode = getLobbyCodeForSocket(socket);
        if (!lobbyCode) return;

        gameManager.handleAction(lobbyCode, socket.id, action);

        // Broadcast updated state
        const state = gameManager.getGameState(lobbyCode);
        if (state) {
          io.to(lobbyCode).emit("game_state_update", state);
        }
      } catch (error) {
        console.error("Error handling game action:", error);
      }
    });

    // Request next round
    socket.on("request_next_round", () => {
      try {
        const lobbyCode = getLobbyCodeForSocket(socket);
        if (!lobbyCode) return;

        const lobby = lobbyManager.getLobby(lobbyCode);
        if (!lobby || lobby.hostId !== socket.id) return;

        // Reset game for next round
        gameManager.resetGame(lobbyCode);
        const game = gameManager.getGame(lobbyCode);
        if (game) {
          game.initialize(lobby.players);
          lobbyManager.updateLobbyStatus(lobbyCode, "in_game");

          // Notify players
          io.to(lobbyCode).emit("game_started", {
            gameId: game.config.id,
            gameName: game.config.name,
            players: lobby.players,
          });

          startGameLoop(lobbyCode, io);
        }
      } catch (error) {
        console.error("Error starting next round:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      handlePlayerLeave(socket, io);
    });
  });
}

function getLobbyCodeForSocket(socket: TypedSocket): string | null {
  const rooms = Array.from(socket.rooms);
  // First room is always the socket ID, second is the lobby code
  return rooms.length > 1 ? rooms[1] : null;
}

function handlePlayerLeave(
  socket: TypedSocket,
  _io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  const lobbyCode = getLobbyCodeForSocket(socket);
  if (!lobbyCode) return;

  const lobby = lobbyManager.removePlayer(lobbyCode, socket.id);

  if (lobby) {
    // Notify remaining players
    socket.to(lobbyCode).emit("player_left", socket.id);
    socket.to(lobbyCode).emit("lobby_updated", lobby);
  } else {
    // Lobby was removed (no players left)
    gameManager.endGame(lobbyCode);
  }

  socket.leave(lobbyCode);
}

function startGameLoop(
  lobbyCode: string,
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  const interval = setInterval(() => {
    const game = gameManager.getGame(lobbyCode);
    if (!game) {
      clearInterval(interval);
      return;
    }

    // Check if round ended
    const roundResult = gameManager.checkRoundEnd(lobbyCode);
    if (roundResult) {
      clearInterval(interval);
      handleRoundEnd(lobbyCode, roundResult, io);
      return;
    }

    // Broadcast current state
    const state = gameManager.getGameState(lobbyCode);
    if (state) {
      io.to(lobbyCode).emit("game_state_update", state);
    }
  }, 100); // Update every 100ms
}

function handleRoundEnd(
  lobbyCode: string,
  roundResult: any,
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  const lobby = lobbyManager.getLobby(lobbyCode);
  if (!lobby) return;

  const winner = lobby.players.find((p) => p.id === roundResult.winnerId);
  if (!winner) return;

  // Update score
  winner.score++;
  lobbyManager.updatePlayerScore(lobbyCode, winner.id, winner.score);

  // Prepare round result
  const result: RoundResult = {
    winnerId: winner.id,
    winnerName: winner.username,
    stats: roundResult.stats,
    scores: Object.fromEntries(lobby.players.map((p) => [p.id, p.score])),
  };

  // Send round result
  io.to(lobbyCode).emit("round_ended", result);

  // Check if someone won the game
  if (winner.score >= lobby.config.pointsToWin) {
    lobbyManager.updateLobbyStatus(lobbyCode, "finished");

    const finalScores = Object.fromEntries(
      lobby.players.map((p) => [p.id, p.score])
    );

    io.to(lobbyCode).emit("game_ended", winner, finalScores);
    gameManager.endGame(lobbyCode);

    // Reset scores for potential rematch
    setTimeout(() => {
      lobbyManager.resetScores(lobbyCode);
      lobbyManager.updateLobbyStatus(lobbyCode, "waiting");
      const updatedLobby = lobbyManager.getLobby(lobbyCode);
      if (updatedLobby) {
        io.to(lobbyCode).emit("lobby_updated", updatedLobby);
      }
    }, 5000); // Wait 5 seconds before resetting
  }
}
