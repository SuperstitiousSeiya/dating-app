"use client";

import { useToast } from "./use-toast";
import { cn } from "../../lib/cn";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[350px]">
      {toasts.map(({ id, title, description, variant }) => (
        <div
          key={id}
          className={cn(
            "rounded-xl border p-4 shadow-lg backdrop-blur-sm animate-fade-up",
            variant === "destructive"
              ? "bg-destructive text-destructive-foreground"
              : "bg-background",
          )}
        >
          {title && <p className="font-semibold text-sm">{title}</p>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      ))}
    </div>
  );
}
