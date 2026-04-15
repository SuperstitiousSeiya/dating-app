export default function MatchesLoading() {
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="h-6 w-32 rounded-lg bg-muted animate-pulse" />
      {/* New matches row */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="size-16 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      {/* Conversation list */}
      <div className="space-y-3 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="size-14 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              <div className="h-3 w-48 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-3 w-10 rounded bg-muted animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
