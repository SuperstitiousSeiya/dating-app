import type { SubscriptionTier } from "@dating-app/validators";

export type UserRole = "user" | "admin" | "moderator";

export type OAuthProvider = {
  provider: "google" | "apple";
  providerId: string;
  email: string;
};

export type UserSubscription = {
  tier: SubscriptionTier;
  expiresAt: string | null;
  stripeSubscriptionId: string | null;
};

/** Full user document — never sent to clients. Backend-only. */
export type User = {
  _id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  oauthProviders: OAuthProvider[];
  role: UserRole;
  isVerified: boolean;
  isPhotoVerified: boolean;
  isBanned: boolean;
  banReason: string | null;
  refreshTokenHash: string | null;
  expoPushToken: string | null;
  stripeCustomerId: string | null;
  subscription: UserSubscription;
  createdAt: string;
  updatedAt: string;
};

/** Safe user shape returned to authenticated clients. */
export type AuthUser = {
  id: string;
  email: string | null;
  role: UserRole;
  isVerified: boolean;
  isPhotoVerified: boolean;
  subscription: UserSubscription;
};

/** JWT access token payload. */
export type JwtPayload = {
  sub: string;
  role: UserRole;
  tier: SubscriptionTier;
  iat: number;
  exp: number;
};
