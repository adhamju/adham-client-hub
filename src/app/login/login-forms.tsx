"use client";

import { useActionState } from "react";
import { signIn, createFirstAdmin } from "@/lib/actions";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type State = { error?: string };
const initialState: State = {};

export function SignInForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    const result = await signIn(formData);
    if (result?.redirectTo) window.location.assign(result.redirectTo);
    return { error: result?.error };
  }, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
      <Input name="password" type="password" placeholder="Password" required autoComplete="current-password" />
      {state.error && <p className="text-[13px] text-signal-action">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function CreateAdminForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    const result = await createFirstAdmin(formData);
    if (result?.redirectTo) window.location.assign(result.redirectTo);
    return { error: result?.error };
  }, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <Input name="full_name" placeholder="Your name" required autoComplete="name" />
      <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
      <Input
        name="password"
        type="password"
        placeholder="Password (min 6 characters)"
        required
        minLength={6}
        autoComplete="new-password"
      />
      {state.error && <p className="text-[13px] text-signal-action">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create admin account"}
      </Button>
    </form>
  );
}
