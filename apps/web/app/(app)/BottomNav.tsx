"use client";

// Isolated to a Client Component because it needs:
//  - usePathname() for active-tab highlighting
//  - useSocket() to open the WebSocket connection for the entire app shell

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MessageCircle, Flame, User, Bell } from "lucide-react";

import { cn } from "../../lib/cn";
import { useSocket } from "../../hooks/use-socket";

const NAV_ITEMS = [
  { href: "/discover",      icon: Flame,         label: "Discover" },
  { href: "/matches",       icon: Heart,         label: "Matches"  },
  { href: "/messages",      icon: MessageCircle, label: "Messages" },
  { href: "/notifications", icon: Bell,          label: "Alerts"   },
  { href: "/profile",       icon: User,          label: "Profile"  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  useSocket(); // Opens + manages the WebSocket connection for the whole shell

  return (
    <nav className="flex border-t bg-background">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
            pathname.startsWith(href)
              ? "text-brand-500"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
