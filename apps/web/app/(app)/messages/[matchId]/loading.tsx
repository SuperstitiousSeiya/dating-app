export default function ChatLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="size-8 rounded-lg bg-muted animate-pulse" />
        <div className="size-10 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
      </div>
      {/* Message bubbles skeleton */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-hidden">
        {[false, true, false, false, true, true, false].map((mine, i) => (
          <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className="h-10 rounded-2xl bg-muted animate-pulse"
              style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}
            />
          </div>
        ))}
      </div>
      {/* Input skeleton */}
      <div className="border-t px-4 py-3 flex gap-2">
        <div className="flex-1 h-10 rounded-2xl bg-muted animate-pulse" />
        <div className="size-10 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  );
}
