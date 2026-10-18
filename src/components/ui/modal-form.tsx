"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionResult = { error?: string; success?: boolean; id?: string } | void;

export function ModalForm({
  trigger,
  title,
  description,
  action,
  submitLabel = "Save",
  children,
  size = "md",
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  action: (formData: FormData) => Promise<ActionResult>;
  submitLabel?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      if (result && result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger}
      </span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-12 sm:pt-24">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "w-full rounded-md border border-base-border bg-base-surface shadow-xl",
              size === "sm" && "max-w-md",
              size === "md" && "max-w-lg",
              size === "lg" && "max-w-2xl"
            )}
          >
            <div className="flex items-start justify-between border-b border-base-border px-5 py-4">
              <div>
                <h2 className="text-[15px] font-medium text-ink">{title}</h2>
                {description && <p className="mt-0.5 text-[13px] text-ink-dim">{description}</p>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-faint hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="max-h-[65vh] overflow-y-auto px-5 py-4">
              {children}
              {error && (
                <p className="mb-3 rounded-sm border border-signal-action/40 bg-signal-action/10 px-3 py-2 text-[13px] text-signal-action">
                  {error}
                </p>
              )}
            </form>
            <div className="flex justify-end gap-2 border-t border-base-border px-5 py-3">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={pending} onClick={() => formRef.current?.requestSubmit()}>
                {pending ? "Saving…" : submitLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ConfirmButton({
  label,
  confirmText,
  action,
  variant = "danger",
}: {
  label: React.ReactNode;
  confirmText: string;
  action: () => Promise<ActionResult>;
  variant?: "danger" | "secondary" | "ghost";
}) {
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          const result = await action();
          if (result && result.error) window.alert(result.error);
          router.refresh();
        });
      }}
    >
      {pending ? "…" : label}
    </Button>
  );
}
