import { redirect } from "next/navigation";
import { getCurrentProfile, getSettings } from "@/lib/queries";
import { AdminSidebar, MobileTabBar } from "@/components/admin/sidebar";
import { hexToRgbTriplet } from "@/lib/utils";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/client");

  const settings = await getSettings();

  return (
    <div className="min-h-screen" style={{ "--accent": hexToRgbTriplet(settings?.primary_color) } as React.CSSProperties}>
      <AdminSidebar businessName={settings?.business_name ?? "Adham Client Hub"} logoUrl={settings?.logo_url ?? null} />
      <div className="md:pl-60">
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
