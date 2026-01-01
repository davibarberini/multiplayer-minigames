import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../../shared/types";

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;

  connect(url: string) {
    this.socket = io(url, {
      transports: ["websocket", "polling"],
    });
    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) {
    if (this.socket) {
      // Type assertion needed due to Socket.IO's dynamic typing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.socket.emit as any)(event, ...args);
    }
  }

  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) {
    // Type assertion needed due to Socket.IO's event handler typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.on(event, handler as any);
  }

  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) {
    // Type assertion needed due to Socket.IO's event handler typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.off(event, handler as any);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
