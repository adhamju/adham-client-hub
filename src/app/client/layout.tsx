import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { getCurrentProfile, getMyClientId, getSettings } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";
import { hexToRgbTriplet } from "@/lib/utils";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");

  const clientId = await getMyClientId();
  const settings = await getSettings();

  if (!clientId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="max-w-sm text-sm text-ink-dim">
          Your account isn't linked to a client company yet. Ask your producer to finish setting up your portal access.
        </p>
        <form action={signOut}>
          <button className="text-[13px] text-signal-waiting hover:underline">Sign out</button>
        </form>
      </main>
    );
  }

  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("company_name, logo_url").eq("id", clientId).maybeSingle();

  return (
    <div className="min-h-screen" style={{ "--accent": hexToRgbTriplet(settings?.primary_color) } as React.CSSProperties}>
      <header className="flex h-16 items-center justify-between border-b border-base-border px-4 md:px-8">
        <Link href="/client" className="flex items-center gap-3">
          {client?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={client.logo_url} alt="" className="h-8 w-8 rounded-sm object-cover" />
          )}
          <div>
            <p className="text-[12px] text-ink-dim">{settings?.business_name ?? "Adham Client Hub"}</p>
            <p className="text-sm font-medium text-ink">{client?.company_name}</p>
          </div>
        </Link>
        <form action={signOut}>
          <button className="flex items-center gap-2 text-[13px] text-ink-dim hover:text-ink">
            <LogOut size={15} /> Sign out
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
