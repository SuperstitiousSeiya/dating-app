import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

// Static page — the form itself is a Client Component.
// Wrapping in Suspense is required in Next.js 16 because useSearchParams()
// inside a Client Component opts the subtree out of static rendering.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="w-full max-w-sm space-y-6 animate-pulse">
      <div className="space-y-2 text-center">
        <div className="mx-auto h-8 w-40 rounded-lg bg-muted" />
        <div className="mx-auto h-4 w-56 rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-10 rounded-lg bg-muted" />
        <div className="h-10 rounded-lg bg-muted" />
        <div className="h-10 rounded-full bg-muted" />
      </div>
    </div>
  );
}
