"use client";

import { X, Heart, Star } from "lucide-react";

import { useDiscoveryStore } from "../../stores/discovery.store";
import { useSwipe } from "../../hooks/use-swipe";
import { ProfileCard } from "../cards/ProfileCard";
import { cn } from "../../lib/cn";

export function SwipeDeck() {
  const { deck, currentIndex } = useDiscoveryStore();
  const { swipe, isPending } = useSwipe();

  const visibleCards = deck.slice(currentIndex, currentIndex + 3);
  const currentProfile = deck[currentIndex];

  if (!currentProfile || visibleCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="text-5xl">✨</div>
        <h2 className="text-xl font-semibold">You&apos;ve seen everyone nearby</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Check back later or expand your distance in preferences.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      {/* Card stack */}
      <div className="relative w-full aspect-[3/4]">
        {[...visibleCards].reverse().map((profile, reversedIdx) => {
          const stackIdx = visibleCards.length - 1 - reversedIdx;
          const isTop = stackIdx === 0;

          return (
            <div
              key={profile._id}
              className={cn(
                "absolute inset-0 transition-transform duration-200",
                !isTop && "pointer-events-none",
              )}
              style={{
                transform: `scale(${1 - stackIdx * 0.04}) translateY(${stackIdx * 12}px)`,
                zIndex: visibleCards.length - stackIdx,
              }}
            >
              <ProfileCard profile={profile} />
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => swipe(currentProfile, "pass")}
          disabled={isPending}
          className="flex size-14 items-center justify-center rounded-full border-2 border-slate-200 bg-white shadow-md hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
          aria-label="Pass"
        >
          <X className="size-7" />
        </button>

        <button
          onClick={() => swipe(currentProfile, "superlike")}
          disabled={isPending}
          className="flex size-12 items-center justify-center rounded-full border-2 border-sky-200 bg-white shadow-md hover:border-sky-400 hover:text-sky-500 transition-colors disabled:opacity-50"
          aria-label="Superlike"
        >
          <Star className="size-5" />
        </button>

        <button
          onClick={() => swipe(currentProfile, "like")}
          disabled={isPending}
          className="flex size-14 items-center justify-center rounded-full border-2 border-brand-200 bg-white shadow-md hover:border-brand-400 hover:text-brand-500 transition-colors disabled:opacity-50"
          aria-label="Like"
        >
          <Heart className="size-7" />
        </button>
      </div>
    </div>
  );
}
