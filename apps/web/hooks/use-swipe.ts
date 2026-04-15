"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PublicProfile } from "@dating-app/types";
import type { SwipeAction } from "@dating-app/validators";

import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { useDiscoveryStore } from "../stores/discovery.store";

/**
 * Encapsulates all swipe logic: optimistically advances the deck,
 * fires the API call, and handles match detection.
 */
export function useSwipe() {
  const queryClient = useQueryClient();
  const { nextCard, setSwipeDirection } = useDiscoveryStore();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ targetId, action }: { targetId: string; action: SwipeAction }) =>
      apiClient.swipes.swipe({ targetId, action }),
    onSuccess: (result) => {
      if (result.isMatch) {
        // Invalidate matches so the new match appears in the list
        void queryClient.invalidateQueries({ queryKey: queryKeys.matches.all() });
      }
    },
  });

  const swipe = useCallback(
    (profile: PublicProfile, action: SwipeAction) => {
      setSwipeDirection(action === "pass" ? "left" : "right");

      // Optimistically advance the deck immediately
      setTimeout(() => nextCard(), 300);

      mutate({ targetId: profile._id, action });
    },
    [mutate, nextCard, setSwipeDirection],
  );

  return { swipe, isPending };
}
