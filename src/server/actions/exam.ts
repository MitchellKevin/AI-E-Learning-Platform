"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDb } from "@/server/db";
import { assertRole } from "@/server/session";
import { UserError } from "@/server/errors";
import { startAttempt, submitAttempt } from "@/server/services/exam";
import { HOUR, rateLimit, rateLimitMessage } from "@/server/services/rate-limit";

// Eindtoets: starten en inleveren. Fouten die de cursist moet zien komen terug als { error }.

const slug = z.string().regex(/^[a-z0-9-]+$/);

// Ook "niet ingelogd" (assertRole) en toetsfouten komen terug als { error }: in productie verbergt Next
// de melding van een gegooide fout.
export async function startExamAction(pathSlug: string, demo: boolean) {
  try {
    const user = await assertRole("learner");
    await connectDb();
    const limited = await rateLimit({ key: `toets-start:user:${user._id}`, limit: 10, windowMs: HOUR });
    if (!limited.ok) return { ok: false as const, error: rateLimitMessage(limited.retryAfterSeconds) };
    return { ok: true as const, ...(await startAttempt(user, slug.parse(pathSlug), demo)) };
  } catch (error) {
    if (error instanceof UserError) return { ok: false as const, error: error.message };
    throw error;
  }
}

const answerValue = z.union([z.string().max(10_000), z.array(z.string().max(40)).max(20)]).optional();

export async function submitExamAction(input: {
  pathSlug: string;
  attemptId: string | null;
  questionIds: string[];
  answers: Record<string, string | string[] | undefined>;
  demo?: { token: string; startedAt: number };
}) {
  const data = z
    .object({
      pathSlug: slug,
      attemptId: z.string().regex(/^[a-f0-9]{24}$/).nullable(),
      questionIds: z.array(z.string().max(80)).max(100),
      answers: z.record(z.string().max(80), answerValue),
      demo: z.object({ token: z.string().max(100), startedAt: z.number().int().positive() }).optional(),
    })
    .parse(input);
  try {
    const user = await assertRole("learner");
    await connectDb();
    const limited = await rateLimit({ key: `toets-inleveren:user:${user._id}`, limit: 20, windowMs: HOUR });
    if (!limited.ok) return { ok: false as const, error: rateLimitMessage(limited.retryAfterSeconds) };
    const outcome = await submitAttempt(user, data);
    revalidatePath("/", "layout");
    return { ok: true as const, ...outcome };
  } catch (error) {
    if (error instanceof UserError) return { ok: false as const, error: error.message };
    throw error;
  }
}
