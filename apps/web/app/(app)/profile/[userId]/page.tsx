// Public profile view — SSR with PPR.
// The static shell (name, age, distance placeholder) renders instantly.
// The dynamic section (real-time online status) streams in separately.
export const experimental_ppr = true;

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, BadgeCheck } from "lucide-react";

import { env } from "../../../../lib/env";

type PageProps = {
  params: Promise<{ userId: string }>;
};

// Async Server Component — awaits params per Next.js 16 contract.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const profile = await fetchPublicProfile(userId);
  if (!profile) return { title: "Profile not found" };
  return {
    title: `${profile.displayName}, ${profile.age}`,
    description: profile.bio || `Meet ${profile.displayName} on Spark.`,
    openGraph: {
      images: profile.photos[0]
        ? [{ url: profile.photos[0].url, width: 1200, height: 630 }]
        : [],
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const profile = await fetchPublicProfile(userId);

  if (!profile) notFound();

  const primaryPhoto = profile.photos.find((p: { order: number }) => p.order === 0) ?? profile.photos[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero photo — static, rendered on server */}
      <div className="relative h-[60vh] w-full bg-muted">
        {primaryPhoto && (
          <Image
            src={primaryPhoto.url}
            alt={`${profile.displayName}'s photo`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      </div>

      {/* Profile info — static shell, instantly available */}
      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">
              {profile.displayName}, {profile.age}
            </h1>
            {profile.isVerified && (
              <BadgeCheck className="size-6 text-sky-500 shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4" />
            <span className="text-sm">
              {profile.distanceKm != null
                ? `${Math.round(profile.distanceKm)} km away`
                : "Location unavailable"}
            </span>
          </div>
        </div>

        {profile.bio && (
          <p className="text-base leading-relaxed">{profile.bio}</p>
        )}

        {/* Prompts — static content, SSR */}
        {profile.prompts?.length > 0 && (
          <div className="space-y-3">
            {profile.prompts.map(
              (prompt: { question: string; answer: string }, i: number) => (
                <div key={i} className="rounded-2xl border bg-card p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {prompt.question}
                  </p>
                  <p className="text-base">{prompt.answer}</p>
                </div>
              ),
            )}
          </div>
        )}

        {/* Photo grid — static */}
        {profile.photos.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            {profile.photos.slice(1).map(
              (photo: { url: string; _id: string; order: number }) => (
                <div key={photo._id} className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src={photo.url}
                    alt={`${profile.displayName} photo ${photo.order + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 300px"
                  />
                </div>
              ),
            )}
          </div>
        )}

        {/* Dynamic hole: online status streams in after static shell */}
        <Suspense fallback={<span className="text-sm text-muted-foreground">Checking activity…</span>}>
          <OnlineStatus userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}

// This async component is the "dynamic hole" in PPR.
// It suspends while fetching live presence data, allowing the static shell above to render first.
async function OnlineStatus({ userId }: { userId: string }) {
  const isOnline = await fetchPresence(userId);
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className={`size-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
      {isOnline ? "Online now" : "Recently active"}
    </div>
  );
}

// ─── Data fetchers (Server-side only) ────────────────────────────────────────

async function fetchPublicProfile(userId: string) {
  try {
    // Next.js 16: fetch is not cached by default.
    // Use `next: { revalidate: N }` to opt into ISR, or `cache: "no-store"` for fully dynamic.
    const res = await fetch(`${env.API_URL}/profiles/${userId}`, {
      next: { revalidate: 60 }, // Revalidate public profile every 60s
    });
    if (!res.ok) return null;
    const json = await res.json() as { data: unknown };
    return json.data as {
      displayName: string;
      age: number;
      bio: string;
      isVerified: boolean;
      distanceKm: number | null;
      photos: Array<{ _id: string; url: string; order: number }>;
      prompts: Array<{ question: string; answer: string }>;
    };
  } catch {
    return null;
  }
}

async function fetchPresence(userId: string) {
  try {
    const res = await fetch(`${env.API_URL}/users/${userId}/presence`, {
      cache: "no-store", // Always live — this is the dynamic hole in PPR
    });
    if (!res.ok) return false;
    const json = await res.json() as { data: { online: boolean } };
    return json.data.online;
  } catch {
    return false;
  }
}
