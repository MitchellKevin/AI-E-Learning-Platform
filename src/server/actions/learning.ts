"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { guarded } from "@/server/actions/result";
import { connectDb } from "@/server/db";
import { User } from "@/server/models";
import { assertRole } from "@/server/session";
import { recordActivity } from "@/server/services/activity";
import { badgeCatalog } from "@/server/services/badges";
import { completeTask, recordQuizResult } from "@/server/services/progress";
import { HOUR, assertRateLimit } from "@/server/services/rate-limit";

const ids = z.object({ chapterId: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/), taskId: z.string().min(1).max(80) });

export async function completeTaskAction(chapterId: string, taskId: string, answer?: string) {
  return guarded(async () => {
    ids.parse({ chapterId, taskId });
    const user = await assertRole("learner");
    await connectDb();
    await assertRateLimit({ key: `taak:user:${user._id}`, limit: 600, windowMs: HOUR });
    const result = await completeTask(user, chapterId, taskId, answer?.slice(0, 2000));
    revalidatePath("/", "layout");
    return {
      chapterCompleted: result.chapterCompleted,
      points: result.points,
      badges: result.badges.map((code) => badgeCatalog.find((b) => b.code === code)?.label ?? code),
    };
  });
}

export async function recordQuizAction(chapterId: string, taskId: string, firstTry: boolean) {
  return guarded(async () => {
    ids.parse({ chapterId, taskId });
    const first = z.boolean().parse(firstTry);
    const user = await assertRole("learner");
    await connectDb();
    await assertRateLimit({ key: `quiz:user:${user._id}`, limit: 600, windowMs: HOUR });
    return recordQuizResult(user, chapterId, taskId, first);
  });
}

// Leertijd: de hoofdstukpagina meldt elke minuut dat ze zichtbaar open staat.
export async function recordMinuteAction() {
  return guarded(async () => {
    const user = await assertRole("learner");
    await connectDb();
    // Hooguit één minuut per 50 seconden, zodat meerdere tabbladen niet dubbel tellen.
    const fresh = await User.updateOne(
      { _id: user._id, $or: [{ lastMinuteAt: null }, { lastMinuteAt: { $lt: new Date(Date.now() - 50_000) } }] },
      { lastMinuteAt: new Date() },
    );
    if (fresh.modifiedCount > 0) await recordActivity(user._id, user.orgId, 1);
  });
}
