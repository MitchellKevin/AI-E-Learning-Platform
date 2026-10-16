"use server";

import { z } from "zod";
import { updateSession } from "@/auth";
import { connectDb } from "@/server/db";
import { User } from "@/server/models";
import { requireUser } from "@/server/session";

const schema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(80),
  role: z.string().max(40).optional(),
  level: z.string().max(40).optional(),
  goals: z.array(z.string().max(40)).max(12),
  weekGoal: z.number().int().min(15).max(1200),
  reminder: z.enum(["dagelijks", "wekelijks", "geen"]),
  levelTest: z.enum(["gedaan", "overgeslagen"]).optional(),
  knownTopics: z.array(z.string().max(60)).max(20).default([]),
});

export type OnboardingInput = z.input<typeof schema>;

// Slaat de intake op en markeert de onboarding als afgerond.
export async function completeOnboarding(input: OnboardingInput) {
  const data = schema.parse(input);
  const user = await requireUser();
  await connectDb();

  await User.updateOne(
    { _id: user._id },
    {
      firstName: data.firstName,
      lastName: data.lastName,
      "onboarding.completedAt": new Date(),
      "onboarding.role": data.role,
      "onboarding.level": data.level,
      "onboarding.goals": data.goals,
      "onboarding.levelTest": data.levelTest,
      "onboarding.knownTopics": data.knownTopics,
      "settings.learning.weekGoal": data.weekGoal,
      "settings.learning.dailyReminder": data.reminder !== "geen",
      "settings.learning.focus": data.role === "developer" ? "development" : data.role === "designer" ? "design" : "beide",
    },
  );

  // Token verversen, zodat de middleware je meteen naar de app laat.
  await updateSession({});
}
