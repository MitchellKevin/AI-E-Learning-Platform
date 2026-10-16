import type { Types } from "mongoose";
import { getLearningPaths, pathProgress, isChapterDone } from "@/lib/content";
import { mockBadgeCatalog } from "@/lib/mock/profile";
import { Certificate, ExamAttempt, PointEvent, PracticeAttempt, TaskProgress, UserBadge } from "@/server/models";
import type { Progress } from "@/lib/types";
import { notify } from "./notifications";
import { totalPoints } from "./points";
import { userStreak } from "./activity";

// Badge-regels. De catalogus (namen en uitleg) is content; of je hem hebt, rekenen we hier uit.

export const badgeCatalog = mockBadgeCatalog;

export type BadgeFacts = {
  progress: Progress;
  streak: number;
  points: number;
  practiceAttempts: number;
  strongPractice: number;
  quizzes: number;
  bestExamScore: number;
  certificates: string[];
};

export async function qualifyingBadges(facts: BadgeFacts) {
  const paths = await getLearningPaths();
  const codes = new Set<string>();
  const anyChapterDone = paths.some((p) => p.topics.some((t) => t.chapters.some((c) => isChapterDone(facts.progress, c))));
  const ai101 = paths.find((p) => p.slug === "ai-101");

  if (anyChapterDone) codes.add("01");
  if (facts.streak >= 7) codes.add("7D");
  if (facts.streak >= 30) codes.add("30D");
  if (facts.practiceAttempts > 0) codes.add("P1");
  if (facts.strongPractice >= 25) codes.add("PRO");
  if (facts.quizzes >= 10) codes.add("Q");
  if (facts.points >= 5000) codes.add("5K");
  if (facts.bestExamScore >= 100) codes.add("100");
  if (ai101 && pathProgress(facts.progress, ai101).done === pathProgress(facts.progress, ai101).total) codes.add("101");
  const ethics = ai101?.topics.find((t) => t.id === "ethiek");
  if (ethics && ethics.chapters.every((c) => isChapterDone(facts.progress, c))) codes.add("ETH");
  if (facts.certificates.some((slug) => slug !== "ai-101")) codes.add("SP");
  return codes;
}

async function gatherFacts(userId: Types.ObjectId): Promise<BadgeFacts> {
  const [tasks, streak, points, practiceAttempts, strongPractice, quizzes, exam, certificates] = await Promise.all([
    TaskProgress.find({ userId }, { chapterId: 1, taskId: 1 }).lean(),
    userStreak(userId),
    totalPoints(userId),
    PracticeAttempt.countDocuments({ userId }),
    PracticeAttempt.countDocuments({ userId, score: { $gte: 80 } }),
    PointEvent.countDocuments({ userId, reason: "quiz" }),
    ExamAttempt.findOne({ userId, submittedAt: { $ne: null } }).sort({ score: -1 }).lean(),
    Certificate.find({ userId }, { pathSlug: 1 }).lean(),
  ]);
  const progress: Progress = { completedTasks: {} };
  for (const t of tasks) (progress.completedTasks[t.chapterId] ??= []).push(t.taskId);
  return {
    progress,
    streak,
    points,
    practiceAttempts,
    strongPractice,
    quizzes,
    bestExamScore: exam?.score ?? 0,
    certificates: certificates.map((c) => c.pathSlug),
  };
}

/** Kent nieuw verdiende badges toe en stuurt een melding. Geeft de nieuwe codes terug. */
export async function evaluateBadges(userId: Types.ObjectId, orgId: Types.ObjectId) {
  const [facts, earned] = await Promise.all([gatherFacts(userId), UserBadge.find({ userId }, { code: 1 }).lean()]);
  const have = new Set(earned.map((b) => b.code));
  const fresh = [...(await qualifyingBadges(facts))].filter((code) => !have.has(code));

  for (const code of fresh) {
    try {
      await UserBadge.create({ userId, code });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) continue;
      throw error;
    }
    const badge = badgeCatalog.find((b) => b.code === code);
    await notify({
      userId,
      orgId,
      type: "badge",
      title: `Badge behaald: ${badge?.label ?? code}`,
      body: badge?.description ?? "",
      href: "/profiel",
    });
  }
  return fresh;
}
