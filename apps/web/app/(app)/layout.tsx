// Server Component — renders the authenticated app shell.
// Only the BottomNav leaf is a Client Component (needs usePathname + useSocket).
// Everything else (header, children) is server-rendered HTML.

import type { Metadata } from "next";
import { BottomNav } from "./BottomNav";

export const metadata: Metadata = {
  title: { template: "%s · Spark", default: "Spark" },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
