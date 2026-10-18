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

        {adminExists ? (
          <SignInForm />
        ) : (
          <>
            <CreateAdminForm />
            <p className="mt-6 text-[12px] text-ink-faint">
              This form only appears once. After the first admin account is created, everyone — you and your clients —
              signs in with the normal sign-in form.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
