const lobbySelectionDiv = document.getElementById("lobby-selection");
const inLobbyDiv = document.getElementById("in-lobby");
const lobbyListUl = document.getElementById("lobby-list");
const createLobbyBtn = document.getElementById("create-lobby-btn");
const lobbyNameInput = document.getElementById("lobby-name-input");
const joinLobbyBtn = document.getElementById("join-lobby-btn");
const lobbyCodeInput = document.getElementById("lobby-code-input");
const refreshLobbiesBtn = document.getElementById("refresh-lobbies");
const lobbyTitleH2 = document.getElementById("lobby-title");
const lobbyCodeDisplay = document.getElementById("lobby-code-display");
const playerListUl = document.getElementById("player-list");
const leaveLobbyBtn = document.getElementById("leave-lobby-btn");
const startGameBtn = document.getElementById("start-game-btn");
const errorMessageDiv = document.getElementById("error-message");
const connectionStatusDiv = document.getElementById("connection-status");
const nameEntryDiv = document.getElementById("name-entry");
const playerNameInput = document.getElementById("player-name-input");
const connectBtn = document.getElementById("connect-btn");
const gameTypeSelect = document.getElementById("game-type-select");
const gameTypeDisplay = document.getElementById("game-type-display");
const playerCountDisplay = document.getElementById("player-count-display");
const maxPlayersDisplay = document.getElementById("max-players-display");

let ws;
let currentLobby = null; // { code: string, name: string, gameType: string, players: {id: string, name: string}[], isHost: boolean, hostId: string, maxPlayers: number }
let myClientId = null;
let myPlayerName = "";
// Hardcode available games on client for now - ideally fetch from server
const availableGames = {
  spaceDuel: { name: "Space Duel" }, // Update to match server
  // Add others if defined on server
};

// --- NEW: Game Area Div ---
const gameAreaDiv = document.createElement("div");
gameAreaDiv.id = "game-area";
gameAreaDiv.classList.add("hidden");
document.body.appendChild(gameAreaDiv); // Add it to the page

function connectWebSocket() {
  // Construct WebSocket URL relative to the current page's origin
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}`;
  console.log("Attempting to connect WebSocket to:", wsUrl);
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connection established");
    connectionStatusDiv.textContent = "Connected to server.";
    // Send initial info including player name
    sendMessage({ type: "setPlayerInfo", payload: { name: myPlayerName } });
    // Request lobby list after setting info
    sendMessage({ type: "getLobbies" });
    // showLobbySelection(); // Show lobby selection *after* server confirms info/sends ID
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log("Message from server:", message);
      handleServerMessage(message);
    } catch (error) {
      console.error("Failed to parse server message:", error);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
    connectionStatusDiv.textContent = "Disconnected.";
    showError("Connection lost. Please refresh the page or try again later.");
    hideAllViews();
    currentLobby = null;
    myClientId = null;
    myPlayerName = ""; // Reset name
    // Show name entry again
    nameEntryDiv.classList.remove("hidden");
    playerNameInput.disabled = false;
    connectBtn.disabled = false;
    connectionStatusDiv.classList.add("hidden");
    // Optional: Implement automatic reconnection logic here, might need rethinking with name entry
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    connectionStatusDiv.textContent = "Connection error.";
    showError(
      "Could not connect to the server. Ensure it is running and refresh."
    );
    hideAllViews();
    // Also reset UI to allow trying again
    nameEntryDiv.classList.remove("hidden");
    playerNameInput.disabled = false;
    connectBtn.disabled = false;
    connectionStatusDiv.classList.add("hidden");
  };
}

function sendMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.error("WebSocket is not connected.");
    showError("Not connected to server. Cannot send message.");
  }
}

function handleServerMessage(message) {
  clearError();
  console.log("Handling Server Message: ", message.type, message.payload);

  switch (message.type) {
    case "yourInfo": // Server confirms connection and assigns ID
      myClientId = message.payload.clientId;
      console.log(`Server assigned Client ID: ${myClientId}`);
      // Now that we have an ID and are connected, show lobby selection
      showLobbySelection();
      break;
    case "lobbyList":
      updateLobbyList(message.payload);
      break;
    case "lobbyCreated":
    case "lobbyJoined":
      enterLobby(message.payload);
      break;
    case "playerJoined":
    case "playerLeft":
    case "updateLobby": // Handles host change
      updateInLobbyView(message.payload);
      break;
    case "gameUpdate": // Sent by the specific game instance on the server
      handleGameUpdate(message.payload);
      break;
    case "gameOver": // Sent by the specific game instance
      handleGameOver(message.payload);
      break;
    case "gameError": // Errors specific to the game logic
      showError(`Game Error: ${message.payload}`);
      break;
    case "error": // General errors
      showError(`Server Error: ${message.payload}`);
      break;
    // We don't have a specific message for client ID assignment yet,
    // but we can infer it when joining/creating a lobby.
    // A dedicated message would be better.
    default:
      console.log("Unknown message type received:", message.type);
  }
}

function updateLobbyList(lobbies) {
  lobbyListUl.innerHTML = ""; // Clear existing list
  if (lobbies.length === 0) {
    lobbyListUl.innerHTML = "<li>No lobbies available. Create one!</li>";
    return;
  }

  lobbies.forEach((lobby) => {
    const li = document.createElement("li");
    const lobbyInfo = document.createElement("span");
    // Display Game Name in lobby list
    const gameName = availableGames[lobby.gameType]?.name || lobby.gameType;
    lobbyInfo.textContent = `${lobby.name} (${gameName}) - ${lobby.playerCount}/${lobby.maxPlayers}`;
    li.appendChild(lobbyInfo);

    // Add a join button for each lobby in the list
    const joinButton = document.createElement("button");
    joinButton.textContent = "Join";
    joinButton.onclick = () => joinLobby(lobby.code);
    li.appendChild(joinButton);

    lobbyListUl.appendChild(li);
  });
}

function createLobby() {
  const lobbyName = lobbyNameInput.value.trim();
  const selectedGameType = gameTypeSelect.value;

  if (!selectedGameType) {
    showError("Please select a game type.");
    return;
  }

  sendMessage({
    type: "createLobby",
    payload: {
      lobbyName: lobbyName || undefined,
      gameType: selectedGameType,
    },
  });
  lobbyNameInput.value = ""; // Clear input
  gameTypeSelect.value = ""; // Reset dropdown
}

function joinLobby(code) {
  const lobbyCode = code || lobbyCodeInput.value.trim();
  if (!lobbyCode) {
    showError("Please enter a lobby code.");
    return;
  }
  sendMessage({ type: "joinLobby", payload: { lobbyCode } });
  lobbyCodeInput.value = ""; // Clear input
}

function refreshLobbies() {
  sendMessage({ type: "getLobbies" });
}

function enterLobby(lobbyData) {
  console.log("Entering lobby: ", lobbyData);
  currentLobby = {
    code: lobbyData.lobbyCode,
    name: lobbyData.lobbyName,
    gameType: lobbyData.gameType,
    isHost: lobbyData.isHost,
    hostId: lobbyData.hostId,
    players: lobbyData.players || [],
    maxPlayers: lobbyData.maxPlayers,
  };
  // Client ID might be already set via 'yourInfo', but update just in case
  if (!myClientId && currentLobby.players.length > 0) {
    myClientId = currentLobby.players.find((p) => p.name === myPlayerName)?.id; // Try to find self
    console.log(`My Client ID (inferred): ${myClientId}`);
  }

  showInLobbyView();
  updateInLobbyView(currentLobby); // Initial population with full data
}

function updateInLobbyView(lobbyUpdate) {
  // Merge updates carefully
  if (lobbyUpdate.players) currentLobby.players = lobbyUpdate.players;
  if (lobbyUpdate.hasOwnProperty("isHost"))
    currentLobby.isHost = lobbyUpdate.isHost;
  if (lobbyUpdate.hostId) currentLobby.hostId = lobbyUpdate.hostId;
  if (lobbyUpdate.lobbyName) currentLobby.name = lobbyUpdate.lobbyName; // Although name changes aren't implemented
  if (lobbyUpdate.gameType) currentLobby.gameType = lobbyUpdate.gameType; // If game could change?
  if (lobbyUpdate.maxPlayers) currentLobby.maxPlayers = lobbyUpdate.maxPlayers;

  // Update UI elements
  lobbyTitleH2.textContent = `Lobby: ${currentLobby.name}`;
  lobbyCodeDisplay.textContent = currentLobby.code;
  gameTypeDisplay.textContent =
    availableGames[currentLobby.gameType]?.name || currentLobby.gameType;
  playerCountDisplay.textContent = currentLobby.players.length;
  maxPlayersDisplay.textContent = currentLobby.maxPlayers;

  playerListUl.innerHTML = ""; // Clear player list
  currentLobby.players.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player.name;
    if (player.id === myClientId) {
      li.textContent += " (You)";
      li.style.fontWeight = "bold";
    }
    // Use explicit hostId from server
    if (player.id === currentLobby.hostId) {
      li.textContent += " (Host)";
    }
    playerListUl.appendChild(li);
  });

  // Show/Hide Start Game button for host
  startGameBtn.classList.toggle("hidden", !currentLobby.isHost);

  // Update lobby status and Start button enablement
  const selectedGameClientInfo = availableGames[currentLobby.gameType];
  // NOTE: We don't have min/max players on client `availableGames` yet.
  // We rely on the server sending correct maxPlayers in lobbyData.
  // And server enforces minPlayers on start. Display could be improved.
  const minPlayers = 2; // Assume 2 for now, server enforces actual
  const maxPlayers = currentLobby.maxPlayers;

  if (currentLobby.players.length < minPlayers) {
    document.getElementById(
      "lobby-status"
    ).textContent = `Waiting for players... (${currentLobby.players.length}/${minPlayers} minimum)`;
    startGameBtn.disabled = true;
  } else if (currentLobby.players.length < maxPlayers) {
    document.getElementById(
      "lobby-status"
    ).textContent = `Ready to start! Waiting for more players... (${currentLobby.players.length}/${maxPlayers})`;
    startGameBtn.disabled = !currentLobby.isHost;
  } else {
    document.getElementById(
      "lobby-status"
    ).textContent = `Lobby full! Ready to start! (${currentLobby.players.length}/${maxPlayers})`;
    startGameBtn.disabled = !currentLobby.isHost;
  }
}

function leaveLobby() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    // Explicitly send leave message? Or just close?
    // Closing is simpler for now, server handles cleanup.
    ws.close();
  }
  // Reset state immediately on client
  currentLobby = null;
  // Don't reset myClientId or myPlayerName here, we might just want to go back to lobby list
  showLobbySelection(); // Go back to lobby selection
  // Request lobby list again after leaving
  sendMessage({ type: "getLobbies" });
  // Ensure clean reconnect if needed later
  // setTimeout(connectWebSocket, 100); // This reconnects immediately, maybe not desired
}

function showLobbySelection() {
  nameEntryDiv.classList.add("hidden"); // <-- Explicitly hide name entry
  connectionStatusDiv.classList.remove("hidden"); // <-- Ensure connection status is visible
  lobbySelectionDiv.classList.remove("hidden"); // Show lobby selection
  inLobbyDiv.classList.add("hidden"); // Hide in-lobby view
  clearError();
}

function showInLobbyView() {
  nameEntryDiv.classList.add("hidden"); // <-- Explicitly hide name entry
  connectionStatusDiv.classList.remove("hidden"); // <-- Ensure connection status is visible
  lobbySelectionDiv.classList.add("hidden"); // Hide lobby selection
  inLobbyDiv.classList.remove("hidden"); // Show in-lobby view
  clearError();
}

function hideAllViews() {
  nameEntryDiv.classList.add("hidden"); // Hide name entry
  lobbySelectionDiv.classList.add("hidden");
  inLobbyDiv.classList.add("hidden");
  // Keep connection status potentially visible for errors/disconnect messages
  // connectionStatusDiv.classList.add('hidden');
}

function showError(message) {
  errorMessageDiv.textContent = message;
  errorMessageDiv.classList.remove("hidden");
}

function clearError() {
  errorMessageDiv.textContent = "";
  errorMessageDiv.classList.add("hidden");
}

function handleInitialConnect() {
  myPlayerName = playerNameInput.value.trim();
  if (!myPlayerName) {
    showError("Please enter your name.");
    return;
  }
  playerNameInput.disabled = true;
  connectBtn.disabled = true;
  nameEntryDiv.classList.add("hidden"); // Hide name entry after connect
  connectionStatusDiv.classList.remove("hidden");
  connectionStatusDiv.textContent = "Connecting...";
  connectWebSocket();
}

// Populate Game Select Dropdown
function populateGameSelect() {
  gameTypeSelect.innerHTML = '<option value="">-- Select Game --</option>'; // Reset
  for (const gameId in availableGames) {
    const option = document.createElement("option");
    option.value = gameId;
    option.textContent = availableGames[gameId].name;
    gameTypeSelect.appendChild(option);
  }
}

// Add event listeners
createLobbyBtn.addEventListener("click", createLobby);
joinLobbyBtn.addEventListener("click", () => joinLobby()); // Needs () => because joinLobby takes optional arg
refreshLobbiesBtn.addEventListener("click", refreshLobbies);
leaveLobbyBtn.addEventListener("click", leaveLobby);
startGameBtn.addEventListener("click", () => {
  console.log("Start game button clicked:" + currentLobby.code);
  sendMessage({ type: "startGame", payload: { lobbyCode: currentLobby.code } });
});
connectBtn.addEventListener("click", handleInitialConnect);

// Initial setup
populateGameSelect(); // Populate the dropdown on load

// --- Game Handling Logic ---

let currentGameState = null; // Store the latest game state received from server
let gameRenderer = null; // Will hold the rendering object (e.g., using Canvas)

// Removed handleGameStart - game entry is now triggered by first gameUpdate

function loadGame(gameType) {
  gameAreaDiv.innerHTML = ""; // Clear previous game content
  currentGameState = null; // Reset game state
  if (gameRenderer && typeof gameRenderer.stop === "function") {
    gameRenderer.stop(); // Stop previous rendering loop if any
    gameRenderer = null;
  }

  // Load based on gameType received in the first gameUpdate
  switch (gameType) {
    case "spaceDuel":
      setupSpaceDuelGame();
      break;
    default:
      // ... (error handling as before) ...
      break;
  }
}

function handleGameUpdate(gameState) {
  console.log("Received gameUpdate:", gameState);
  currentGameState = gameState;

  // If this is the first update, it signifies game start
  if (!gameRenderer) {
    showGameArea();
    loadGame(currentGameState.gameType || "spaceDuel"); // Load based on state if needed
  }

  // Update the UI based on the new state
  if (gameRenderer && typeof gameRenderer.update === "function") {
    gameRenderer.update(currentGameState);
  }

  // Also update any non-canvas UI elements if needed
  if (currentGameState.gameType === "spaceDuel") {
    updateSpaceDuelUI(currentGameState);
  }
}

function handleGameOver(payload) {
  console.log("Received gameOver:", payload);
  currentGameState = payload.finalState;
  if (gameRenderer && typeof gameRenderer.gameOver === "function") {
    gameRenderer.gameOver(payload.winnerId);
  }
  // Display winner message prominently
  const winnerInfo = currentGameState.playerStates[payload.winnerId];
  const message = winnerInfo ? `${winnerInfo.name} wins!` : "It's a draw!";

  const gameOverDiv = document.createElement("div");
  gameOverDiv.id = "game-over-message";
  gameOverDiv.innerHTML = `<h2>Game Over!</h2><p>${message}</p>`;
  const backButton = document.createElement("button");
  backButton.textContent = "Back to Lobbies";
  backButton.onclick = () => {
    ws.close(); // Force disconnect and reset
    // showLobbySelection(); // This will happen on ws.onclose
  };
  gameOverDiv.appendChild(backButton);
  gameAreaDiv.appendChild(gameOverDiv);
}

// --- Specific Game Setup: Space Duel ---

function setupSpaceDuelGame() {
  // Create the basic structure for the game UI
  gameAreaDiv.innerHTML = `
      <div id="space-duel-ui">
           <h2>Space Duel - Turn: <span id="turn-counter">0</span> Phase: <span id="phase-display">Waiting...</span></h2>
           <div id="game-canvas-container" style="position: relative; width: 500px; height: 500px; background-color: #1e1e2e; margin: 10px auto; border: 1px solid #6272a4;">
               <canvas id="game-canvas" width="500" height="500"></canvas>
               <div id="action-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none; cursor: crosshair;"></div>
           </div>
           <div id="player-status"></div>
           <div id="controls">
               <p>Plan your turn:</p>
               <button id="plan-move-btn">Plan Move</button>
               <button id="plan-shot-btn">Plan Shot</button>
               <button id="submit-turn-btn" disabled>Submit Turn</button>
               <button id="cancel-plan-btn" style="display: none;">Cancel Plan</button>
           </div>
           <button id="leave-game-btn">Leave Game</button>
       </div>
  `;

  // Initialize the Canvas renderer
  const canvas = document.getElementById("game-canvas");
  gameRenderer = new SpaceDuelRenderer(canvas); // We'll create this class later

  // Add event listeners for controls
  addSpaceDuelEventListeners();

  // Update UI based on initial state if available
  if (currentGameState) {
    updateSpaceDuelUI(currentGameState);
    gameRenderer.update(currentGameState);
  }
}

function updateSpaceDuelUI(gameState) {
  document.getElementById("turn-counter").textContent = gameState.turn;
  document.getElementById("phase-display").textContent = gameState.phase;

  const controls = document.getElementById("controls");
  const submitBtn = document.getElementById("submit-turn-btn");
  const playerState = gameState.playerStates[myClientId];

  if (
    gameState.phase === "planning" &&
    playerState &&
    !playerState.actionSubmitted
  ) {
    controls.style.display = "block";
    submitBtn.disabled = !playerState.plannedMove && !playerState.plannedShot; // Enable if at least one action is planned
  } else {
    controls.style.display = "none";
  }

  // Update player status display
  const statusDiv = document.getElementById("player-status");
  statusDiv.innerHTML = "<h3>Players:</h3>";
  Object.values(gameState.playerStates).forEach((pState) => {
    statusDiv.innerHTML += `
        <p>
            ${pState.name} ${pState.id === myClientId ? "(You)" : ""}
            (Health: ${pState.health})
            ${
              gameState.phase === "planning" && pState.actionSubmitted
                ? " [Ready]"
                : ""
            }
        </p>
    `;
  });
}

let planningState = { type: null, target: null }; // 'move' or 'shot'

function addSpaceDuelEventListeners() {
  const leaveBtn = document.getElementById("leave-game-btn");
  const planMoveBtn = document.getElementById("plan-move-btn");
  const planShotBtn = document.getElementById("plan-shot-btn");
  const submitTurnBtn = document.getElementById("submit-turn-btn");
  const cancelPlanBtn = document.getElementById("cancel-plan-btn");
  const actionOverlay = document.getElementById("action-overlay");

  leaveBtn.onclick = () => {
    console.log("Leaving game...");
    ws.close(); // Force disconnect and reset
  };

  planMoveBtn.onclick = () => startPlanning("move");
  planShotBtn.onclick = () => startPlanning("shot");
  cancelPlanBtn.onclick = () => cancelPlanning();

  actionOverlay.onclick = (event) => {
    if (!planningState.type) return;
    const canvasRect = document
      .getElementById("game-canvas")
      .getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    confirmPlanning(x, y);
  };

  submitTurnBtn.onclick = () => {
    if (!currentGameState || currentGameState.phase !== "planning") return;
    const playerState = currentGameState.playerStates[myClientId];
    if (!playerState || playerState.actionSubmitted) return;

    console.log(
      "Submitting turn with:",
      playerState.plannedMove,
      playerState.plannedShot
    );
    sendMessage({
      type: "gameAction",
      payload: {
        action: "submitTurn",
        lobbyCode: currentLobby.code,
        move: playerState.plannedMove,
        shot: playerState.plannedShot,
      },
    });
    // Visually indicate submission? Server state update will eventually hide controls.
    submitTurnBtn.disabled = true;
    submitTurnBtn.textContent = "Waiting...";
  };
}

function startPlanning(type) {
  planningState.type = type;
  document.getElementById("action-overlay").style.display = "block";
  document.getElementById("controls").style.display = "none"; // Hide normal controls
  document.getElementById("cancel-plan-btn").style.display = "inline-block";
  console.log(`Planning ${type}... Click on the canvas.`);
}

function confirmPlanning(x, y) {
  if (!planningState.type || !currentGameState) return;
  const playerState = currentGameState.playerStates[myClientId];
  if (!playerState) return;

  const target = { targetX: x, targetY: y };
  if (planningState.type === "move") {
    playerState.plannedMove = target;
    console.log("Move planned:", target);
  } else if (planningState.type === "shot") {
    playerState.plannedShot = target;
    console.log("Shot planned:", target);
  }

  // Update renderer preview?
  if (gameRenderer && typeof gameRenderer.updatePlanning === "function") {
    gameRenderer.updatePlanning(
      playerState.plannedMove,
      playerState.plannedShot
    );
  }

  cancelPlanning(); // Go back to normal controls view
  // Re-enable submit button if needed
  document.getElementById("submit-turn-btn").disabled = false;
}

function cancelPlanning() {
  planningState.type = null;
  document.getElementById("action-overlay").style.display = "none";
  document.getElementById("controls").style.display = "block";
  document.getElementById("cancel-plan-btn").style.display = "none";
}

// --- Placeholder Renderer --- TODO: Implement properly ---
class SpaceDuelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    console.log("Space Duel Renderer Initialized");
  }

  update(gameState) {
    // Clear canvas
    this.ctx.fillStyle = "#1e1e2e"; // Background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw players
    Object.values(gameState.playerStates).forEach((pState) => {
      this.ctx.fillStyle = pState.id === myClientId ? "#8be9fd" : "#ff5555"; // Cyan for self, Red for others
      this.ctx.fillRect(pState.position.x - 5, pState.position.y - 5, 10, 10); // Simple square
      // Draw name?
      this.ctx.fillStyle = "#f8f8f2";
      this.ctx.fillText(
        pState.name,
        pState.position.x + 10,
        pState.position.y + 5
      );
      // Draw planned actions (if in planning phase)
      if (gameState.phase === "planning" && pState.id === myClientId) {
        this.drawPlanning(pState.plannedMove, pState.plannedShot);
      }
    });

    // Draw projectiles (if any)
    // gameState.projectiles.forEach(proj => { ... });
  }

  drawPlanning(move, shot) {
    this.ctx.strokeStyle = "#50fa7b"; // Green
    this.ctx.lineWidth = 1;
    const playerState = currentGameState.playerStates[myClientId];
    if (!playerState) return;
    const startX = playerState.position.x;
    const startY = playerState.position.y;

    if (move) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(move.targetX, move.targetY);
      this.ctx.stroke();
      this.ctx.fillText("M", move.targetX + 5, move.targetY);
    }
    if (shot) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.setLineDash([5, 5]); // Dashed line for shot
      this.ctx.lineTo(shot.targetX, shot.targetY);
      this.ctx.stroke();
      this.ctx.setLineDash([]); // Reset line dash
      this.ctx.fillText("S", shot.targetX + 5, shot.targetY);
    }
  }

  updatePlanning(move, shot) {
    // Called immediately when a plan is made, redraw planning lines
    if (currentGameState) {
      this.update(currentGameState); // Redraw everything
      this.drawPlanning(move, shot);
    }
  }

  gameOver(winnerId) {
    console.log("Renderer notified of Game Over");
    // Maybe draw something special?
  }

  stop() {
    // Cleanup if needed (e.g., stop animation frame loops)
    console.log("Stopping Space Duel Renderer");
  }
}
// --- End Renderer ---

function showGameArea() {
  nameEntryDiv.classList.add("hidden");
  connectionStatusDiv.classList.add("hidden"); // Hide connection status during game
  lobbySelectionDiv.classList.add("hidden");
  inLobbyDiv.classList.add("hidden");
  gameAreaDiv.classList.remove("hidden"); // Show game area
  clearError();
}
