import "server-only";

import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

// React's `cache()` deduplicates calls within a single render pass,
// giving us one stable QueryClient per server request without a singleton.
export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          // Server-prefetched data is considered fresh for 60 s on the client,
          // preventing an immediate refetch on mount.
          staleTime: 60_000,
        },
      },
    }),
);
