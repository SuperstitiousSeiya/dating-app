"use client";

// Client Component: owns swipe interactions, Zustand deck state, and
// TanStack Query subscription. Data is pre-populated by the Server Component
// via HydrationBoundary, so the initial render never shows a loading spinner.

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../../../lib/api-client";
import { queryKeys } from "../../../lib/query-keys";
import { useDiscoveryStore } from "../../../stores/discovery.store";
import { SwipeDeck } from "../../../components/discovery/SwipeDeck";

export function DiscoverView() {
  const { data: feed, isError } = useQuery({
    queryKey: queryKeys.discovery.feed(),
    // This queryFn only runs if the server-prefetched data is stale or missing.
    queryFn: () => apiClient.discovery.getFeed(),
    staleTime: 5 * 60 * 1000,
  });

  const { setDeck } = useDiscoveryStore();

  useEffect(() => {
    if (feed) setDeck(feed);
  }, [feed, setDeck]);

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your feed. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <SwipeDeck />
    </div>
  );
}
