import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnboardingFlow } from "@/components/auth/onboarding/onboarding-flow";
import { getLevelTest, getOnboardingOptions, getOnboardingProfile } from "@/lib/data/auth";
import { getLearningPath } from "@/lib/content";

export const metadata: Metadata = {
  title: "Welkom – AI Academy",
  robots: { index: false },
};

// Intake na het accepteren van een uitnodiging. De keuzes leven nu alleen in de browser.
export default async function WelcomePage() {
  const [profile, options, levelTest] = await Promise.all([
    getOnboardingProfile(),
    getOnboardingOptions(),
    getLevelTest(),
  ]);
  const path = await getLearningPath(profile.assignedPath.slug);
  if (!path) notFound();

  return (
    <OnboardingFlow
      profile={profile}
      options={options}
      levelTest={levelTest}
      path={{
        title: path.title,
        hours: path.hours,
        topics: path.topics.map((topic) => ({ id: topic.id, title: topic.title, chapters: topic.chapters.length })),
      }}
    />
  );
}
