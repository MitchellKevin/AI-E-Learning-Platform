import type { Metadata } from "next";
import { getDataExport, getProfile, getSettings } from "@/lib/data/profile";
import { DataExport } from "@/components/settings/data-export";
import { DeleteAccount } from "@/components/settings/delete-account";
import { PrivacyForm } from "@/components/settings/privacy-form";

export const metadata: Metadata = { title: "Privacy · Instellingen · AI Academy" };

export default async function PrivacySettingsPage() {
  const [settings, profile, exportData] = await Promise.all([getSettings(), getProfile(), getDataExport()]);

  return (
    <>
      <PrivacyForm initial={settings.privacy} team={profile.team} />
      <DataExport data={exportData.data} fileName={exportData.fileName} />
      <DeleteAccount organisation={profile.organisation} />
    </>
  );
}
