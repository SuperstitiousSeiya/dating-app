/**
 * Centralized TanStack Query key factory.
 * Colocating keys prevents magic strings across hooks and enables targeted invalidation.
 */
export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },

  profiles: {
    me: () => ["profiles", "me"] as const,
    byId: (userId: string) => ["profiles", userId] as const,
  },

  discovery: {
    feed: () => ["discovery", "feed"] as const,
  },

  matches: {
    all: () => ["matches"] as const,
    list: (cursor?: string) => ["matches", "list", cursor] as const,
  },

  messages: {
    byMatch: (matchId: string) => ["messages", matchId] as const,
    page: (matchId: string, cursor?: string) =>
      ["messages", matchId, cursor] as const,
  },

  notifications: {
    all: () => ["notifications"] as const,
  },
} as const;
