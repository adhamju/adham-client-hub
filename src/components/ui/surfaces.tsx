import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md border border-base-border bg-base-surface", className)} {...props} />;
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "action" | "waiting" | "done" | "hold" }) {
  const tones: Record<string, string> = {
    neutral: "text-ink-dim bg-base-raised border-base-border",
    action: "text-signal-action bg-signal-action/10 border-signal-action/30",
    waiting: "text-signal-waiting bg-signal-waiting/10 border-signal-waiting/30",
    done: "text-signal-done bg-signal-done/10 border-signal-done/30",
    hold: "text-signal-hold bg-signal-hold/10 border-signal-hold/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[12px] font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <p className="text-[13px] text-ink-dim">{label}</p>
      <p className="mt-1.5 font-mono text-2xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-ink-faint">{hint}</p>}
    </Card>
  );
}

export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-base-border py-12 text-center">
      <p className="text-sm text-ink-dim">{title}</p>
      {action}
    </div>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-medium text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-base-raised", className)} />;
}
