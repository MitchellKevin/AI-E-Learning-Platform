"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { reviewPrompt } from "@/components/practice/review-prompt";
import { getExercise } from "@/lib/data/practice";
import { guarded } from "@/server/actions/result";
import { connectDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { PracticeAttempt } from "@/server/models";
import { assertRole } from "@/server/session";
import { evaluateBadges } from "@/server/services/badges";
import { awardPoints } from "@/server/services/points";
import { HOUR, assertRateLimit } from "@/server/services/rate-limit";

// Oefening afronden. De server beoordeelt de prompt opnieuw: een score uit de browser vertrouwen we niet.
export async function finishPracticeAction(slug: string, prompt: string, previous?: string) {
  return guarded(async () => {
    const input = z
      .object({ slug: z.string().max(80), prompt: z.string().min(1).max(8000), previous: z.string().max(8000).optional() })
      .parse({ slug, prompt, previous });
    const user = await assertRole("learner");
    const exercise = await getExercise(input.slug);
    if (!exercise || exercise.slug === "vrij") throw new UserError("Onbekende oefening");
    await connectDb();
    await assertRateLimit({ key: `oefening:user:${user._id}`, limit: 60, windowMs: HOUR });

    const { score } = reviewPrompt(input.prompt, { exercise, previous: input.previous });
    if (score < exercise.passScore) return { ok: false as const, score };

    await PracticeAttempt.create({ userId: user._id, orgId: user.orgId, exerciseSlug: exercise.slug, prompt: input.prompt, score, completed: true });
    const awarded = await awardPoints({
      userId: user._id,
      orgId: user.orgId,
      reason: "oefening",
      refId: exercise.slug,
      amount: exercise.points,
      label: `Oefening afgerond: ${exercise.title}`,
    });
    await evaluateBadges(user._id, user.orgId);
    revalidatePath("/", "layout");
    return { ok: true as const, score, points: awarded ? exercise.points : 0 };
  });
}
