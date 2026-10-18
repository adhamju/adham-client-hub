import { VIDEO_BALL, BALL_LABEL, VIDEO_STATUS_LABEL, VIDEO_STATUS_STYLE } from "@/lib/constants";
import type { VideoStatus } from "@/lib/database.types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: VideoStatus }) {
  const style = VIDEO_STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[12px] font-medium",
        style.text,
        style.bg,
        style.border
      )}
    >
      {VIDEO_STATUS_LABEL[status]}
    </span>
  );
}

export function BallIndicator({ status, clientView = false }: { status: VideoStatus; clientView?: boolean }) {
  const holder = VIDEO_BALL[status];
  const dot =
    holder === "adham" ? "bg-signal-action" : holder === "client" ? "bg-signal-waiting" : "bg-signal-done";
  const label = clientView
    ? holder === "client"
      ? "Your review is needed"
      : holder === "adham"
        ? "We're working on it"
        : "Completed"
    : BALL_LABEL[holder];
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-dim">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}
