import Link from "next/link";
import type { Metadata } from "next";

// ISR: revalidate the marketing page every hour.
// Next.js 15 no longer caches fetch by default, but static routes without
// dynamic data are still statically generated. We use ISR here so that
// stat counters or headline copy can be updated without a redeploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Spark — Find Your Connection",
  description: "Meet people who share your energy. Real connections, no games.",
  openGraph: {
    title: "Spark — Find Your Connection",
    description: "Meet people who share your energy. Real connections, no games.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Spark" }],
  },
};

// Server Component — no "use client" needed, rendered on the server at ISR cadence.
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b">
        <span className="text-2xl font-bold text-brand-500">✦ Spark</span>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-sm font-medium hover:text-brand-500 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-green-500" />
          Thousands of people online right now
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
          Real connections,{" "}
          <span className="text-brand-500">no games.</span>
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground">
          Spark matches you with people who share your energy and intentions.
          No endless swiping — just meaningful conversations.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-brand-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Create free account
          </Link>
          <Link
            href="/about"
            className="rounded-full border px-8 py-3.5 text-base font-semibold hover:bg-secondary transition-colors"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* Features — statically rendered */}
      <section className="grid sm:grid-cols-3 gap-6 border-t px-8 py-16 max-w-5xl mx-auto w-full">
        {[
          { emoji: "✨", title: "Quality matches", body: "Our algorithm surfaces people you'll actually connect with." },
          { emoji: "🔒", title: "Safe & private", body: "Photo verification, block/report, and your location is never shared." },
          { emoji: "💬", title: "Real conversations", body: "Icebreaker prompts and thoughtful design lead to deeper chats." },
        ].map(({ emoji, title, body }) => (
          <div key={title} className="rounded-2xl border p-6 space-y-2">
            <span className="text-3xl">{emoji}</span>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      {/* Social proof */}
      <section className="border-t px-8 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Trusted by <strong className="text-foreground">500,000+</strong> people worldwide
        </p>
      </section>
    </main>
  );
}
