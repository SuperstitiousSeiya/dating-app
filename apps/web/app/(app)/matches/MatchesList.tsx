"use client";

// Client Component: owns infinite scroll and real-time new-match updates.
// First page is pre-populated by the Server Component via HydrationBoundary.

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";

import { formatRelativeTime, truncate } from "@dating-app/utils";

import { apiClient } from "../../../lib/api-client";
import { queryKeys } from "../../../lib/query-keys";

export function MatchesList() {
  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: queryKeys.matches.all(),
      queryFn: ({ pageParam }) =>
        apiClient.matches.getAll({
          cursor: pageParam as string | undefined,
          limit: 20,
        }),
      getNextPageParam: (last) => last.pagination.nextCursor ?? undefined,
      initialPageParam: undefined,
    });

  const matches = data?.pages.flatMap((p) => p.data) ?? [];

  if (matches.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <HeartIcon className="size-16 text-brand-200" />
        <h2 className="text-xl font-semibold">No matches yet</h2>
        <p className="text-sm text-muted-foreground">
          Keep swiping — your people are out there.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ul className="divide-y">
        {matches.map((match) => (
          <li key={match._id}>
            <Link
              href={`/messages/${match._id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
                {match.profile?.photos[0] && (
                  <Image
                    src={match.profile.photos[0].url}
                    alt={match.profile.displayName}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold truncate">
                    {match.profile?.displayName}
                  </p>
                  {match.lastMessageAt && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(match.lastMessageAt)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {match.lastMessagePreview
                    ? truncate(match.lastMessagePreview, 50)
                    : "Say hello! 👋"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <div className="p-4 text-center">
          <button
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-sm text-brand-500 hover:underline disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}
