import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries";

export default async function RootPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  redirect(profile.role === "admin" ? "/admin" : "/client");
}
