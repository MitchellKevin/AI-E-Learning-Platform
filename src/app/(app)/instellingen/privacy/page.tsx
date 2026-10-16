import type { Metadata } from "next";
import { getProfile, getSettings } from "@/lib/data/profile";
import { requireUser } from "@/server/session";
import { DataExport } from "@/components/settings/data-export";
import { DeleteAccount } from "@/components/settings/delete-account";
import { PrivacyForm } from "@/components/settings/privacy-form";

export const metadata: Metadata = { title: "Privacy · Instellingen · AI Academy" };

export default async function PrivacySettingsPage() {
  const [settings, profile, user] = await Promise.all([getSettings(), getProfile(), requireUser()]);
  const scheduled = user.deletionRequestedAt
    ? new Date(user.deletionRequestedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  return (
    <>
      <PrivacyForm initial={settings.privacy} team={profile.team} />
      <DataExport />
      <DeleteAccount organisation={profile.organisation} scheduled={scheduled} />
    </>
  );
}
