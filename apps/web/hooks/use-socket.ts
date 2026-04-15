"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

import { SOCKET_EVENTS, type Message, type MatchWithProfile } from "@dating-app/types";

import { getSocket } from "../lib/socket";
import { useAuthStore } from "../stores/auth.store";
import { useChatStore } from "../stores/chat.store";

/**
 * Connects to the Socket.io server when the user is authenticated.
 * Sets up all global event listeners and cleans them up on unmount.
 */
export function useSocket(): { socket: Socket | null; isConnected: boolean } {
  const { accessToken } = useAuthStore();
  const { addMessage, setTyping, markRead } = useChatStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = getSocket(accessToken);
    socketRef.current = socket;

    if (!socket.connected) socket.connect();

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (message: Message) => {
      addMessage(message.matchId, message);
    });

    socket.on(
      SOCKET_EVENTS.CHAT_TYPING_INDICATOR,
      ({ matchId, userId, isTyping }: { matchId: string; userId: string; isTyping: boolean }) => {
        setTyping(matchId, userId, isTyping);
      },
    );

    socket.on(
      SOCKET_EVENTS.CHAT_READ_RECEIPT,
      ({ matchId, readAt }: { matchId: string; readAt: string }) => {
        markRead(matchId, readAt);
      },
    );

    return () => {
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE);
      socket.off(SOCKET_EVENTS.CHAT_TYPING_INDICATOR);
      socket.off(SOCKET_EVENTS.CHAT_READ_RECEIPT);
    };
  }, [accessToken, addMessage, setTyping, markRead]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  };
}
