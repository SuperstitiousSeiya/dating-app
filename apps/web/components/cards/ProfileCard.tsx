"use client";

import Image from "next/image";
import { MapPin, BadgeCheck } from "lucide-react";
import { useState } from "react";

import type { PublicProfile } from "@dating-app/types";
import { formatDistance } from "@dating-app/utils";

type ProfileCardProps = {
  profile: PublicProfile;
};

export function ProfileCard({ profile }: ProfileCardProps) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = profile.photos.sort((a, b) => a.order - b.order);
  const currentPhoto = photos[photoIdx];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-muted shadow-xl select-none">
      {/* Photo */}
      {currentPhoto ? (
        <Image
          src={currentPhoto.url}
          alt={profile.displayName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 400px) 100vw, 400px"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-brand-100 to-brand-300" />
      )}

      {/* Photo navigation dots */}
      {photos.length > 1 && (
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setPhotoIdx(i)}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i === photoIdx ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Click zones for photo navigation */}
      <div className="absolute inset-0 flex">
        <div className="w-1/3 h-full" onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))} />
        <div className="w-2/3 h-full" onClick={() => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))} />
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">
                {profile.displayName}, {profile.age}
              </h2>
              {profile.isVerified && (
                <BadgeCheck className="size-5 text-sky-400 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="size-3.5" />
              <span>{formatDistance(profile.distanceKm)}</span>
            </div>

            {profile.bio && (
              <p className="text-sm text-white/90 line-clamp-2 mt-1">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Prompts */}
        {profile.prompts[0] && (
          <div className="mt-3 rounded-xl bg-white/15 backdrop-blur-sm px-3 py-2">
            <p className="text-xs text-white/70">{profile.prompts[0].question}</p>
            <p className="text-sm text-white font-medium mt-0.5">{profile.prompts[0].answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
