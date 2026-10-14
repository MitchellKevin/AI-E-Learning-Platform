import type { Metadata } from "next";
import { getSettings } from "@/lib/data/profile";
import { LearningForm } from "@/components/settings/learning-form";

export const metadata: Metadata = { title: "Leren · Instellingen · AI Academy" };

export default async function LearningSettingsPage() {
  const settings = await getSettings();
  return <LearningForm initial={settings.learning} />;
}
