export default function DiscoverLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
      {/* Card skeleton */}
      <div className="relative w-full max-w-sm aspect-[3/4] rounded-3xl bg-muted animate-pulse overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
          <div className="h-7 w-40 rounded-lg bg-muted-foreground/20" />
          <div className="h-4 w-24 rounded-lg bg-muted-foreground/20" />
        </div>
      </div>
      {/* Action buttons skeleton */}
      <div className="flex items-center gap-6">
        <div className="size-14 rounded-full bg-muted animate-pulse" />
        <div className="size-16 rounded-full bg-muted animate-pulse" />
        <div className="size-14 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  );
}
