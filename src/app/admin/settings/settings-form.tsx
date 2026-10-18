"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FieldGroup, Input, Label, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CURRENCIES } from "@/lib/constants";
import type { Settings } from "@/lib/database.types";

export function SettingsForm({
  settings,
  adminName,
  action,
}: {
  settings: Settings | null;
  adminName: string;
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean } | void>;
}) {
  const [pending, startTransition] = React.useTransition();
  const [message, setMessage] = React.useState<{ text: string; ok: boolean } | null>(null);
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await action(formData);
          if (result && result.error) {
            setMessage({ text: result.error, ok: false });
          } else {
            setMessage({ text: "Saved.", ok: true });
            router.refresh();
          }
        });
      }}
    >
      <FieldGroup>
        <Label htmlFor="business_name">Business name</Label>
        <Input id="business_name" name="business_name" defaultValue={settings?.business_name} required />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="admin_display_name">Your display name</Label>
        <Input id="admin_display_name" name="admin_display_name" defaultValue={adminName} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="logo_url">Logo link</Label>
        <Input id="logo_url" name="logo_url" type="url" placeholder="https://" defaultValue={settings?.logo_url ?? ""} />
      </FieldGroup>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="primary_color">Primary color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="primary_color_picker"
              type="color"
              defaultValue={settings?.primary_color ?? "#E4432B"}
              className="h-10 w-12 p-1"
              onChange={(e) => {
                const text = document.getElementById("primary_color") as HTMLInputElement | null;
                if (text) text.value = e.target.value.toUpperCase();
              }}
            />
            <Input
              id="primary_color"
              name="primary_color"
              defaultValue={settings?.primary_color ?? "#E4432B"}
              pattern="#[0-9a-fA-F]{6}"
              placeholder="#E4432B"
            />
          </div>
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="default_currency">Default currency</Label>
          <Select id="default_currency" name="default_currency" defaultValue={settings?.default_currency ?? "USD"}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FieldGroup>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" defaultValue={settings?.timezone ?? "Asia/Damascus"} />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="date_format">Date format</Label>
          <Select id="date_format" name="date_format" defaultValue={settings?.date_format ?? "DD/MM/YYYY"}>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </Select>
        </FieldGroup>
      </div>
      {message && (
        <p className={`mb-3 text-[13px] ${message.ok ? "text-signal-done" : "text-signal-action"}`}>{message.text}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
