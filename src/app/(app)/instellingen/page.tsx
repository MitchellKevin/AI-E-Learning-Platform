import type { Metadata } from "next";
import { getProfile, getSettings } from "@/lib/data/profile";
import { AccountForm } from "@/components/settings/account-form";

export const metadata: Metadata = { title: "Account · Instellingen · AI Academy" };

export default async function AccountSettingsPage() {
  const [settings, profile] = await Promise.all([getSettings(), getProfile()]);

  return (
    <AccountForm
      initial={settings.account}
      email={profile.email}
      loginProvider={profile.loginProvider}
      team={profile.team}
      organisation={profile.organisation}
    />
  );
}
