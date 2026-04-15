"use client";

import { create } from "zustand";

import type { AuthUser } from "@dating-app/types";

import { setAccessToken } from "../lib/api-client";
import { connectSocket, disconnectSocket } from "../lib/socket";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
};

type AuthActions = {
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,

  setAuth: (user, accessToken) => {
    setAccessToken(accessToken);
    connectSocket(accessToken);
    set({ user, accessToken, isLoading: false });
  },

  clearAuth: () => {
    setAccessToken(null);
    disconnectSocket();
    set({ user: null, accessToken: null });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: () => set({ isInitialized: true }),
}));
