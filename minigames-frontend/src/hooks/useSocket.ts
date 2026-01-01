import { useEffect, useState, useCallback } from "react";
import { socketService } from "../services/socket";
import type {
  Lobby,
  Player,
  GameStartData,
  RoundResult,
  MiniGameConfig,
  GameAction,
} from "../../../shared/types";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://192.168.68.107:3001";

export function useSocket() {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [gameState, setGameState] = useState<unknown>(null);
  const [gameData, setGameData] = useState<GameStartData | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [availableGames, setAvailableGames] = useState<MiniGameConfig[]>([]);
  const [publicLobbies, setPublicLobbies] = useState<Lobby[]>([]);

  useEffect(() => {
    const socket = socketService.connect(SERVER_URL);

    socket.on("connect", () => {
      console.log("Connected to server");
      setConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnected(false);
    });

    socket.on("available_games", (games) => {
      setAvailableGames(games);
    });

    socket.on("public_lobbies", (lobbies) => {
      setPublicLobbies(lobbies);
    });

    socket.on("lobby_created", (lobbyData) => {
      setLobby(lobbyData);
      setError(null);
    });

    socket.on("lobby_joined", (lobbyData) => {
      setLobby(lobbyData);
      setError(null);
    });

    socket.on("lobby_updated", (lobbyData) => {
      setLobby(lobbyData);
    });

    socket.on("player_joined", (player) => {
      console.log("Player joined:", player.username);
    });

    socket.on("player_left", (playerId) => {
      console.log("Player left:", playerId);
    });

    socket.on("game_started", (data) => {
      setGameData(data);
      setGameState(null);
      setRoundResult(null);
      setGameWinner(null);
      setError(null);

      // Update lobby status to in_game
      setLobby((prevLobby) =>
        prevLobby ? { ...prevLobby, status: "in_game" } : null
      );
    });

    socket.on("game_state_update", (state) => {
      setGameState(state);
    });

    socket.on("round_ended", (result) => {
      setRoundResult(result);
    });

    socket.on("game_ended", (winner, finalScores) => {
      setGameWinner(winner);
      console.log(
        "Game ended! Winner:",
        winner.username,
        "Scores:",
        finalScores
      );
    });

    socket.on("error", ({ message }) => {
      setError(message);
      console.error("Socket error:", message);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const createLobby = useCallback((username: string, color: string) => {
    socketService.emit("create_lobby", { username, color });
  }, []);

  const joinLobby = useCallback(
    (code: string, username: string, color: string) => {
      socketService.emit("join_lobby", { code, username, color });
    },
    []
  );

  const leaveLobby = useCallback(() => {
    socketService.emit("leave_lobby");
    setLobby(null);
    setGameData(null);
    setGameState(null);
    setRoundResult(null);
    setGameWinner(null);
  }, []);

  const startGame = useCallback(() => {
    socketService.emit("start_game");
  }, []);

  const sendGameAction = useCallback((action: GameAction) => {
    socketService.emit("game_action", action);
  }, []);

  const requestNextRound = useCallback(() => {
    socketService.emit("request_next_round");
    setRoundResult(null);
    setGameState(null);
  }, []);

  const getPublicLobbies = useCallback(() => {
    socketService.emit("get_public_lobbies");
  }, []);

  const toggleLobbyPrivacy = useCallback((isPrivate: boolean) => {
    socketService.emit("toggle_lobby_privacy", isPrivate);
  }, []);

  return {
    connected,
    lobby,
    gameData,
    gameState,
    roundResult,
    gameWinner,
    error,
    availableGames,
    publicLobbies,
    createLobby,
    joinLobby,
    leaveLobby,
    startGame,
    sendGameAction,
    requestNextRound,
    getPublicLobbies,
    toggleLobbyPrivacy,
  };
}
