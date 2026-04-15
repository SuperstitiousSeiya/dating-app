// Async Server Component — prefetches the first page of matches so the list
// renders instantly with real data, no spinner on first load.

import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient } from "../../../lib/get-query-client";
import { fetchMatches } from "../../../lib/server-fetcher";
import { queryKeys } from "../../../lib/query-keys";
import { MatchesList } from "./MatchesList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Matches" };

export default async function MatchesPage() {
  const qc = getQueryClient();

  // prefetchInfiniteQuery seeds the first page; the client takes over from there.
  await qc.prefetchInfiniteQuery({
    queryKey: queryKeys.matches.all(),
    queryFn: () => fetchMatches({ limit: 20 }),
    initialPageParam: undefined,
  });

  return (
    <>
      {/* Static server-rendered header — no JS needed */}
      <header className="border-b px-4 py-4">
        <h1 className="text-xl font-semibold">Matches</h1>
      </header>

      <HydrationBoundary state={dehydrate(qc)}>
        <MatchesList />
      </HydrationBoundary>
    </>
  );
}
