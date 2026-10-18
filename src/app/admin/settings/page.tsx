import { getSettings, getCurrentProfile } from "@/lib/queries";
import { updateSettings } from "@/lib/actions";
import { Card } from "@/components/ui/surfaces";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const [settings, profile] = await Promise.all([getSettings(), getCurrentProfile()]);

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-lg font-semibold text-ink">Settings</h1>
      <Card className="p-5">
        <SettingsForm settings={settings} adminName={profile?.full_name ?? ""} action={updateSettings} />
      </Card>
    </div>
  );
}
