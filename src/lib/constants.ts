import type { PaymentStatus, ProjectStatus, VideoStatus } from "@/lib/database.types";

export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
  NOT_STARTED: "Not started",
  EDITING: "Editing",
  SENT_FOR_REVIEW: "Sent for review",
  REVISION_REQUESTED: "Revision requested",
  APPROVED: "Approved",
  DELIVERED: "Delivered",
};

export const VIDEO_STATUS_ORDER: VideoStatus[] = [
  "NOT_STARTED",
  "EDITING",
  "SENT_FOR_REVIEW",
  "REVISION_REQUESTED",
  "APPROVED",
  "DELIVERED",
];

// Static strings (not built dynamically) so Tailwind's compiler sees every class.
export const VIDEO_STATUS_STYLE: Record<VideoStatus, { text: string; bg: string; border: string }> = {
  NOT_STARTED: { text: "text-ink-dim", bg: "bg-base-raised", border: "border-base-border" },
  EDITING: { text: "text-signal-action", bg: "bg-signal-action/10", border: "border-signal-action/40" },
  SENT_FOR_REVIEW: { text: "text-signal-waiting", bg: "bg-signal-waiting/10", border: "border-signal-waiting/40" },
  REVISION_REQUESTED: { text: "text-signal-action", bg: "bg-signal-action/10", border: "border-signal-action/40" },
  APPROVED: { text: "text-signal-done", bg: "bg-signal-done/10", border: "border-signal-done/40" },
  DELIVERED: { text: "text-signal-done", bg: "bg-signal-done/10", border: "border-signal-done/40" },
};

// Who currently needs to act on this video?
export type BallHolder = "adham" | "client" | "done";

export const VIDEO_BALL: Record<VideoStatus, BallHolder> = {
  NOT_STARTED: "adham",
  EDITING: "adham",
  SENT_FOR_REVIEW: "client",
  REVISION_REQUESTED: "adham",
  APPROVED: "done",
  DELIVERED: "done",
};

export const BALL_LABEL: Record<BallHolder, string> = {
  adham: "Action required from Adham",
  client: "Waiting for client",
  done: "Completed",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
};

export const PAYMENT_BADGE_TONE: Record<PaymentStatus, "action" | "hold" | "done"> = {
  UNPAID: "action",
  PARTIALLY_PAID: "hold",
  PAID: "done",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Wise", "PayPal", "Other"] as const;

export const CURRENCIES = ["USD", "EUR", "GBP", "SYP", "TRY", "AED", "SAR"] as const;
