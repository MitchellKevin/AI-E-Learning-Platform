import type { Types } from "mongoose";
import { getChapter } from "@/lib/content";
import type { Progress } from "@/lib/types";
import { UserError } from "@/server/errors";
import { TaskProgress } from "@/server/models";
import { recordActivity } from "./activity";
import { evaluateBadges } from "./badges";
import { POINTS, awardPoints } from "./points";

// Voortgang per taak. Een hoofdstuk is af als al zijn taken af zijn.

export async function getUserProgress(userId: Types.ObjectId): Promise<Progress> {
  const docs = await TaskProgress.find({ userId }, { chapterId: 1, taskId: 1 }).lean();
  const completedTasks: Progress["completedTasks"] = {};
  for (const doc of docs) (completedTasks[doc.chapterId] ??= []).push(doc.taskId);
  return { completedTasks };
}

export async function findChapter(chapterId: string) {
  const [pathSlug, chapterSlug] = chapterId.split("/");
  return pathSlug && chapterSlug ? getChapter(pathSlug, chapterSlug) : undefined;
}

export type CompleteTaskResult = {
  chapterCompleted: boolean;
  points: number;
  badges: string[];
};

export async function completeTask(
  user: { _id: Types.ObjectId; orgId: Types.ObjectId },
  chapterId: string,
  taskId: string,
  answer?: string,
): Promise<CompleteTaskResult> {
  const found = await findChapter(chapterId);
  if (!found || !found.chapter.tasks.some((t) => t.id === taskId)) throw new UserError("Onbekende taak");
  const { chapter, path } = found;

  await TaskProgress.updateOne(
    { userId: user._id, chapterId, taskId },
    { $setOnInsert: { orgId: user.orgId, pathSlug: path.slug, completedAt: new Date() }, ...(answer && { $set: { answer } }) },
    { upsert: true },
  );
  await recordActivity(user._id, user.orgId);

  const done = await TaskProgress.countDocuments({ userId: user._id, chapterId, taskId: { $in: chapter.tasks.map((t) => t.id) } });
  const chapterCompleted = done >= chapter.tasks.length;
  let points = 0;
  if (chapterCompleted) {
    const awarded = await awardPoints({
      userId: user._id,
      orgId: user.orgId,
      reason: "hoofdstuk",
      refId: chapterId,
      amount: chapter.points ?? POINTS.hoofdstuk,
      label: `Hoofdstuk ${chapter.number} afgerond`,
    });
    if (awarded) points = chapter.points ?? POINTS.hoofdstuk;
  }

  const badges = await evaluateBadges(user._id, user.orgId);
  return { chapterCompleted, points, badges };
}

/** Kennischeck of quiz in één keer goed: quizpunten (één keer per vraag). */
export async function recordQuizResult(
  user: { _id: Types.ObjectId; orgId: Types.ObjectId },
  chapterId: string,
  taskId: string,
  firstTry: boolean,
) {
  if (firstTry !== true) return 0;
  const found = await findChapter(chapterId);
  const task = found?.chapter.tasks.find((t) => t.id === taskId);
  if (!task || !task.blocks.some((b) => b.type === "quiz" || b.type === "knowledge_check")) {
    throw new UserError("Onbekende quizvraag");
  }
  const awarded = await awardPoints({
    userId: user._id,
    orgId: user.orgId,
    reason: "quiz",
    refId: `${chapterId}/${taskId}`,
    amount: POINTS.quiz,
    label: "Kennischeck foutloos",
  });
  return awarded ? POINTS.quiz : 0;
}
