import type { Gender, Intent, GeoPoint } from "@dating-app/validators";

export type ProfilePhoto = {
  _id: string;
  cloudinaryId: string;
  url: string;
  width: number;
  height: number;
  order: number;
  isVerificationPhoto: boolean;
};

export type ProfilePrompt = {
  question: string;
  answer: string;
};

export type ProfilePreferences = {
  ageRange: { min: number; max: number };
  maxDistanceKm: number;
  genders: Gender[];
  intent: Intent;
};

export type ProfileStats = {
  likesGiven: number;
  likesReceived: number;
  superlikesGiven: number;
  matchCount: number;
};

/** Full profile document. */
export type Profile = {
  _id: string;
  userId: string;
  displayName: string;
  birthDate: string;
  age: number;
  bio: string;
  gender: Gender;
  interestedIn: Gender[];
  photos: ProfilePhoto[];
  prompts: ProfilePrompt[];
  location: GeoPoint;
  lastActive: string;
  preferences: ProfilePreferences;
  stats: ProfileStats;
  createdAt: string;
  updatedAt: string;
};

/** Public profile — shown to other users. Strips private fields. */
export type PublicProfile = Pick<
  Profile,
  "_id" | "displayName" | "age" | "bio" | "gender" | "photos" | "prompts" | "lastActive"
> & {
  distanceKm: number;
  isVerified: boolean;
};
