import { io, type Socket } from "socket.io-client";

import { SOCKET_EVENTS } from "@dating-app/types";

import { env } from "./env";

let socket: Socket | null = null;

/**
 * Returns the Socket.io singleton, creating it if it doesn't exist.
 * Pass the access token to authenticate the WebSocket handshake.
 */
export function getSocket(accessToken?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(env.WS_URL, {
    auth: accessToken ? { token: accessToken } : undefined,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"],
    autoConnect: false,
  });

  return socket;
}

export function connectSocket(accessToken: string): void {
  const s = getSocket(accessToken);
  s.auth = { token: accessToken };
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export { SOCKET_EVENTS };
