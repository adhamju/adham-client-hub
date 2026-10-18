"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm text-ink">Something went wrong loading this page.</p>
      <p className="text-[13px] text-ink-dim">
        Your data is safe. Try again, and if it keeps happening, sign out and back in (your session may have expired).
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <a href="/login">
          <Button variant="secondary">Go to sign in</Button>
        </a>
      </div>
    </main>
  );
}
