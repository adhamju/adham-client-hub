import { createClient } from "@/lib/supabase/server";
import { SignInForm, CreateAdminForm } from "./login-forms";

export default async function LoginPage() {
  const supabase = createClient();
  const { data: adminExists } = await supabase.rpc("admin_exists");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-lg font-semibold text-ink">Adham Client Hub</h1>
        <p className="mb-6 text-[13px] text-ink-dim">
          {adminExists ? "Sign in to your account." : "No admin account exists yet — create the first one below."}
        </p>

        <SignInForm />

        {!adminExists && (
          <div className="mt-10 border-t border-base-border pt-6">
            <p className="mb-3 text-[13px] text-ink-dim">
              First time? Create the first admin account here. This form disappears once an admin exists.
            </p>
            <CreateAdminForm />
          </div>
        )}
      </div>
    </main>
  );
}
