import { getExam, type ExamAttempt } from "./exam";
import { connectDb } from "@/server/db";
import { requireUser } from "@/server/session";
import { userAttempts } from "@/server/services/exam";

// Toetspogingen van de ingelogde gebruiker, uit MongoDB.

export async function getExamAttempts(pathSlug: string): Promise<ExamAttempt[]> {
  const user = await requireUser();
  await connectDb();
  return userAttempts(user._id, pathSlug);
}

// Samenvatting voor op de leerpadpagina.
export async function getExamOverview(pathSlug: string) {
  const [exam, attempts] = await Promise.all([getExam(pathSlug), getExamAttempts(pathSlug)]);
  if (!exam) return undefined;
  const best = attempts.reduce<number | null>((max, a) => (max === null || a.score > max ? a.score : max), null);
  return {
    questionCount: exam.questionCount,
    passingScore: exam.passingScore,
    maxAttempts: exam.maxAttempts,
    estimatedMinutes: exam.estimatedMinutes,
    chapterSlug: exam.chapterSlug,
    attemptsUsed: attempts.length,
    bestScore: best,
    passed: attempts.some((a) => a.passed),
  };
}
