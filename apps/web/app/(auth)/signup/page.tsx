// Server Component — static shell, zero client JS on the page level.
// The interactive form is isolated in SignupForm (Client Component).
import type { Metadata } from "next";
import { Suspense } from "react";

import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create account" };

// No dynamic params or personalised data — pre-render as static.
export const dynamic = "force-static";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<SignupSkeleton />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}

function SignupSkeleton() {
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
