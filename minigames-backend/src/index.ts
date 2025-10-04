import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { ClientToServerEvents, ServerToClientEvents } from "../../shared/types";
import { setupEventHandlers } from "./events";

const app = express();
const httpServer = createServer(app);

// Configure CORS - Allow connections from any origin in development
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or any origin in development
    if (!origin || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(null, origin === process.env.CLIENT_URL);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO setup
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: corsOptions,
});

// Setup event handlers
setupEventHandlers(io);

// Basic health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const PORT = Number(process.env.PORT) || 3001;
const HOST = "0.0.0.0"; // Listen on all network interfaces
httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🎮 Ready to host games!`);
  console.log(`🌐 Server accessible at:`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://${HOST}:${PORT} (all network interfaces)`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
