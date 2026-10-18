import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-mono text-3xl text-ink">404</p>
      <p className="text-sm text-ink-dim">This page doesn't exist, or you don't have access to it.</p>
      <Link href="/" className="text-[13px] text-signal-waiting hover:underline">
        Go back home
      </Link>
    </main>
  );
}
