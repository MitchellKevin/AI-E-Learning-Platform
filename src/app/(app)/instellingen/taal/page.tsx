import type { Metadata } from "next";
import { getSettings } from "@/lib/data/profile";
import { LanguageForm } from "@/components/settings/language-form";

export const metadata: Metadata = { title: "Taal · Instellingen · AI Academy" };

export default async function LanguageSettingsPage() {
  const settings = await getSettings();
  return <LanguageForm initial={settings.language} />;
}
