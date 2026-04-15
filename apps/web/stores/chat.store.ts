"use client";

import { create } from "zustand";

import type { Message } from "@dating-app/types";

type OptimisticMessage = Message & { isPending?: boolean };

type ChatState = {
  activeMatchId: string | null;
  messages: Record<string, OptimisticMessage[]>;
  typingUsers: Record<string, boolean>;
};

type ChatActions = {
  setActiveMatch: (matchId: string | null) => void;
  addMessage: (matchId: string, message: OptimisticMessage) => void;
  confirmMessage: (matchId: string, tempId: string, confirmed: Message) => void;
  setTyping: (matchId: string, userId: string, isTyping: boolean) => void;
  markRead: (matchId: string, readAt: string) => void;
};

export const useChatStore = create<ChatState & ChatActions>((set) => ({
  activeMatchId: null,
  messages: {},
  typingUsers: {},

  setActiveMatch: (activeMatchId) => set({ activeMatchId }),

  addMessage: (matchId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [matchId]: [...(state.messages[matchId] ?? []), message],
      },
    })),

  confirmMessage: (matchId, tempId, confirmed) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [matchId]: (state.messages[matchId] ?? []).map((m) =>
          m._id === tempId ? { ...confirmed, isPending: false } : m,
        ),
      },
    })),

  setTyping: (matchId, userId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [`${matchId}:${userId}`]: isTyping },
    })),

  markRead: (matchId, readAt) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [matchId]: (state.messages[matchId] ?? []).map((m) =>
          !m.readAt ? { ...m, readAt } : m,
        ),
      },
    })),
}));
