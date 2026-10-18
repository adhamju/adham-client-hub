"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Label, Textarea } from "@/components/ui/field";
import { approveVideo, requestRevision, submitFeedback } from "@/lib/actions";

export function ApproveButton({ videoId }: { videoId: string }) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <Button
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Approve this video? This confirms it's ready for final delivery.")) return;
          startTransition(async () => {
            const result = await approveVideo(videoId);
            if (result?.error) setError(result.error);
            else router.refresh();
          });
        }}
      >
        {pending ? "Approving…" : "Approve video"}
      </Button>
      {error && <p className="mt-2 text-[13px] text-signal-action">{error}</p>}
    </div>
  );
}

export function RequestRevisionForm({ videoId }: { videoId: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Request a revision
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await requestRevision(videoId, formData);
          if (result?.error) setError(result.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="w-full space-y-3"
    >
      <FieldGroup className="mb-0">
        <Label htmlFor="message">What needs to change?</Label>
        <Textarea id="message" name="message" required placeholder="Be as specific as you can — timestamps help." />
      </FieldGroup>
      <FieldGroup className="mb-0">
        <Label htmlFor="link">Reference link (optional)</Label>
        <Input id="link" name="link" type="url" placeholder="https://" />
      </FieldGroup>
      {error && <p className="text-[13px] text-signal-action">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send revision request"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function LeaveFeedbackForm({ videoId }: { videoId: string }) {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await submitFeedback(videoId, formData);
          if (result?.error) setError(result.error);
          else {
            formRef.current?.reset();
            router.refresh();
          }
        });
      }}
      className="space-y-3"
    >
      <FieldGroup className="mb-0">
        <Label htmlFor="fb-message">Leave feedback</Label>
        <Textarea id="fb-message" name="message" required placeholder="A general comment or note for the team…" />
      </FieldGroup>
      <FieldGroup className="mb-0">
        <Label htmlFor="fb-link">Link (optional)</Label>
        <Input id="fb-link" name="link" type="url" placeholder="https://" />
      </FieldGroup>
      {error && <p className="text-[13px] text-signal-action">{error}</p>}
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
