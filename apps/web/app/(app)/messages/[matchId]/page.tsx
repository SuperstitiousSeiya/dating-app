// Async Server Component — dual responsibility:
//  1. Generates dynamic metadata from the match (partner name, not just ID).
//  2. Prefetches the first page of messages + match details so ChatView renders
//     with real content on first paint, not a loading skeleton.

import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient } from "../../../../lib/get-query-client";
import { fetchMessages, fetchMatchById } from "../../../../lib/server-fetcher";
import { queryKeys } from "../../../../lib/query-keys";
import { ChatView } from "./ChatView";

type PageProps = {
  params: Promise<{ matchId: string }>;
};

// Next.js 16: params is a Promise in Server Components.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { matchId } = await params;

  try {
    const match = await fetchMatchById(matchId);
    const partner = (match.data as { profile?: { displayName?: string } })?.profile
      ?.displayName;
    return {
      title: partner ? `Chat with ${partner}` : `Chat · ${matchId.slice(-6)}`,
    };
  } catch {
    return { title: `Chat · ${matchId.slice(-6)}` };
  }
}

// Real-time, personalized — never serve stale HTML.
export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: PageProps) {
  const { matchId } = await params;
  const qc = getQueryClient();

  // Prefetch the first 30 messages so ChatView renders the conversation
  // immediately without a spinner. The client takes over for older pages
  // and real-time incoming messages.
  await qc.prefetchInfiniteQuery({
    queryKey: queryKeys.messages.byMatch(matchId),
    queryFn: () => fetchMessages(matchId, { limit: 30 }),
    initialPageParam: undefined,
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ChatView matchId={matchId} />
    </HydrationBoundary>
  );
}
