"use client";

import { create } from "zustand";

import type { PublicProfile } from "@dating-app/types";

type DiscoveryState = {
  deck: PublicProfile[];
  currentIndex: number;
  swipeDirection: "left" | "right" | null;
};

type DiscoveryActions = {
  setDeck: (deck: PublicProfile[]) => void;
  appendDeck: (profiles: PublicProfile[]) => void;
  nextCard: () => void;
  setSwipeDirection: (dir: "left" | "right" | null) => void;
  reset: () => void;
};

export const useDiscoveryStore = create<DiscoveryState & DiscoveryActions>((set) => ({
  deck: [],
  currentIndex: 0,
  swipeDirection: null,

  setDeck: (deck) => set({ deck, currentIndex: 0 }),
  appendDeck: (profiles) =>
    set((state) => ({ deck: [...state.deck, ...profiles] })),
  nextCard: () =>
    set((state) => ({ currentIndex: state.currentIndex + 1, swipeDirection: null })),
  setSwipeDirection: (swipeDirection) => set({ swipeDirection }),
  reset: () => set({ deck: [], currentIndex: 0, swipeDirection: null }),
}));
