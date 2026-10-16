import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/auth/onboarding/onboarding-flow";
import { getLevelTest, getOnboardingOptions, getOnboardingProfile } from "@/lib/data/auth";
import { getLearningPath } from "@/lib/content";
import { SignedInAs } from "@/components/auth/signed-in-as";
import { initialsOf } from "@/server/models/user";
import { requireUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Welkom – AI Academy",
  robots: { index: false },
};

// Intake na het accepteren van een uitnodiging of na de eerste keer inloggen.
export default async function WelcomePage() {
  const user = await requireUser();
  // Al afgerond (volgens de database): niet nog een keer de intake.
  if (user.onboarding?.completedAt) redirect("/dashboard");

  const [profile, options, levelTest] = await Promise.all([
    getOnboardingProfile(),
    getOnboardingOptions(),
    getLevelTest(),
  ]);
  const path = await getLearningPath(profile.assignedPath.slug);
  if (!path) notFound();

  return (
    <>
      <SignedInAs
        name={`${user.firstName} ${user.lastName}`.trim()}
        email={user.email}
        initials={initialsOf(user.firstName, user.lastName, user.email)}
      />
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
    </>
  );
}
