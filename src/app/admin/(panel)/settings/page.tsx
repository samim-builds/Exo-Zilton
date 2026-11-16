import { PageHeader } from "@/components/admin/shell/PageHeader";
import { getSettingsForEdit } from "@/lib/cms/admin-queries";
import { isSettingKey } from "@/lib/cms/settings";
import { SettingsForm } from "./SettingsForm";

export const metadata = {
  title: "Settings | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const settings = await getSettingsForEdit();

  return (
    <div>
      <PageHeader title="Settings" description="Store details, navigation, the announcement bar and the welcome offer." />
      <SettingsForm settings={settings} initialTab={isSettingKey(tab) ? tab : "contact"} />
    </div>
  );
}
