import type { PublicProfile } from "./profile";

export type MatchStatus = "active" | "unmatched";

export type Match = {
  _id: string;
  participants: [string, string];
  initiatedBy: string;
  isSuperlike: boolean;
  status: MatchStatus;
  unmatchedBy: string | null;
  unmatchedAt: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
};

/** Match enriched with the other participant's public profile. */
export type MatchWithProfile = Match & {
  profile: PublicProfile;
  unreadCount: number;
};
