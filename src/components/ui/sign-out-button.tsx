"use client";

import * as React from "react";
import { signOut } from "@/lib/actions";

export function SignOutButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const [pending, setPending] = React.useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await signOut();
        } finally {
          window.location.assign("/login");
        }
      }}
    >
      {children}
    </button>
  );
}
