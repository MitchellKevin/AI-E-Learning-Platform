import type { Metadata } from "next";
import { getProfile, getSettings } from "@/lib/data/profile";
import { NotificationsForm } from "@/components/settings/notifications-form";

export const metadata: Metadata = { title: "Meldingen · Instellingen · AI Academy" };

export default async function NotificationSettingsPage() {
  const [settings, profile] = await Promise.all([getSettings(), getProfile()]);
  return <NotificationsForm initial={settings.notifications} email={profile.email} />;
}
