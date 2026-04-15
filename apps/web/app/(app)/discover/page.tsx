// Async Server Component — prefetches the discovery feed into the TanStack
// Query cache before sending HTML to the browser. The client-side DiscoverView
// receives hydrated data and never shows a loading spinner on first render.

import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient } from "../../../lib/get-query-client";
import { fetchDiscoveryFeed } from "../../../lib/server-fetcher";
import { queryKeys } from "../../../lib/query-keys";
import { DiscoverView } from "./DiscoverView";

// Personalized per-user feed — never serve from CDN or server cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const qc = getQueryClient();

  // Prefetch runs on the server; errors are silently swallowed so a failed
  // backend call renders an empty deck rather than a 500 page.
  await qc.prefetchQuery({
    queryKey: queryKeys.discovery.feed(),
    queryFn: fetchDiscoveryFeed,
  });

  return (
    // HydrationBoundary serializes the server QueryClient state into the HTML
    // payload. On the client, TanStack Query deserializes it into its own cache.
    <HydrationBoundary state={dehydrate(qc)}>
      <DiscoverView />
    </HydrationBoundary>
  );
}
