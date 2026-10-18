"use client";

import { UserPlus } from "lucide-react";
import { ModalForm, ConfirmButton } from "@/components/ui/modal-form";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, Label } from "@/components/ui/field";
import { createClientAccount, setClientAccountDisabled } from "@/lib/actions";

export function CreateClientAccountModal({ clientId }: { clientId: string }) {
  return (
    <ModalForm
      trigger={
        <Button size="sm" variant="secondary">
          <UserPlus size={14} /> Create portal login
        </Button>
      }
      title="Create client portal login"
      description="They sign in at the same /login page with this email and password, and land straight in their own portal."
      action={(formData) => createClientAccount(clientId, formData)}
    >
      <FieldGroup>
        <Label htmlFor="full_name">Contact name</Label>
        <Input id="full_name" name="full_name" required />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="password">Temporary password (min 6 characters)</Label>
        <Input id="password" name="password" type="text" minLength={6} required />
      </FieldGroup>
    </ModalForm>
  );
}

export function DisableAccountButton({
  userId,
  clientId,
  disabled,
}: {
  userId: string;
  clientId: string;
  disabled: boolean;
}) {
  return (
    <ConfirmButton
      label={disabled ? "Re-enable" : "Disable"}
      variant={disabled ? "secondary" : "danger"}
      confirmText={
        disabled
          ? "Re-enable this login?"
          : "Disable this login? They won't be able to sign in until you re-enable it."
      }
      action={() => setClientAccountDisabled(userId, clientId, !disabled)}
    />
  );
}
