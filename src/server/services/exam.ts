import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { Types } from "mongoose";
import { drawQuestions, gradeExam, seedFrom, type Answers } from "@/components/exam/exam-logic";
import { allChapters, getLearningPath, isChapterDone } from "@/lib/content";
import { getExam, type Exam, type ExamQuestion } from "@/lib/data/exam";
import { Certificate, ExamAttempt, User, fullName } from "@/server/models";
import { evaluateBadges } from "./badges";
import { notify } from "./notifications";
import { POINTS, awardPoints } from "./points";
import { getUserProgress } from "./progress";
import { UserError } from "@/server/errors";

// Eindtoets: vragen trekken, nakijken op de server en bij slagen het certificaat uitgeven.

type Learner = { _id: Types.ObjectId; orgId: Types.ObjectId };

/** Vraag zonder antwoorden, uitleg of beoordelingscriteria: dit is wat de browser tijdens de toets ziet. */
export function withoutAnswers(question: ExamQuestion): ExamQuestion {
  const base = { ...question, explanation: "" };
  if (question.type === "single") return { ...base, type: "single", options: question.options, correct: "" };
  if (question.type === "multiple") return { ...base, type: "multiple", options: question.options, correct: [] };
  return { ...base, type: "open", criteria: question.criteria.map((c) => ({ label: c.label, keywords: [] })), modelAnswer: "", minWords: question.minWords };
}

export async function examRequirementMet(userId: Types.ObjectId, pathSlug: string, exam: Exam) {
  const [path, progress] = await Promise.all([getLearningPath(pathSlug), getUserProgress(userId)]);
  if (!path) return false;
  return allChapters(path)
    .filter((c) => c.slug !== exam.chapterSlug)
    .every((c) => isChapterDone(progress, c));
}

export async function attemptsUsed(userId: Types.ObjectId, pathSlug: string) {
  return ExamAttempt.countDocuments({ userId, pathSlug, submittedAt: { $ne: null } });
}

export class ExamError extends UserError {}

// Een demo wordt niet opgeslagen. Het token bewijst dat de vragen door de server zijn getrokken,
// zodat niemand willekeurige vraag-id's laat nakijken.
function demoToken(userId: Types.ObjectId, pathSlug: string, questionIds: string[], startedAt: number) {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(`toets-demo:${userId}:${pathSlug}:${startedAt}:${questionIds.join(",")}`)
    .digest("base64url");
}

function validDemoToken(token: string, expected: string) {
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Start een poging. Zonder afgeronde voorwaarden alleen als demo: die wordt niet opgeslagen. */
export async function startAttempt(user: Learner, pathSlug: string, demo: boolean) {
  const exam = await getExam(pathSlug);
  if (!exam) throw new ExamError("Onbekende toets");

  const [met, used, passed] = await Promise.all([
    examRequirementMet(user._id, pathSlug, exam),
    attemptsUsed(user._id, pathSlug),
    ExamAttempt.exists({ userId: user._id, pathSlug, passed: true }),
  ]);
  // Een demo kan alleen zolang je de toets nog niet mag maken; daarna is elke poging echt.
  const real = met;
  if (!met && !demo) throw new ExamError("Rond eerst alle hoofdstukken af");
  if (real && passed) throw new ExamError("Je hebt deze toets al gehaald");
  if (real && used >= exam.maxAttempts) throw new ExamError("Je hebt geen pogingen meer over");

  const startedAt = new Date();
  const deadline = new Date(startedAt.getTime() + exam.timeLimitMinutes * 60_000);
  const seed = seedFrom(`${user._id}:${pathSlug}:${startedAt.getTime()}:${randomInt(1_000_000)}`);
  const questions = drawQuestions(exam.questions, exam.questionCount, seed);

  let attemptId: string | null = null;
  if (real) {
    const attempt = await ExamAttempt.create({
      userId: user._id,
      orgId: user.orgId,
      pathSlug,
      questionIds: questions.map((q) => q.id),
      startedAt,
    });
    attemptId = String(attempt._id);
  }

  return {
    attemptId,
    demoToken: real ? null : demoToken(user._id, pathSlug, questions.map((q) => q.id), startedAt.getTime()),
    number: used + 1,
    questions: questions.map(withoutAnswers),
    startedAt: startedAt.getTime(),
    deadline: deadline.getTime(),
  };
}

// Kleine marge voor netwerkvertraging bij automatisch inleveren.
const GRACE_MS = 60_000;

export async function submitAttempt(
  user: Learner,
  input: {
    pathSlug: string;
    attemptId: string | null;
    questionIds: string[];
    answers: Answers;
    demo?: { token: string; startedAt: number };
  },
) {
  const exam = await getExam(input.pathSlug);
  if (!exam) throw new ExamError("Onbekende toets");

  let questionIds = input.questionIds;
  let attempt = null;
  if (input.attemptId) {
    attempt = await ExamAttempt.findOne({ _id: input.attemptId, userId: user._id, pathSlug: input.pathSlug });
    if (!attempt) throw new ExamError("Poging niet gevonden");
    if (attempt.submittedAt) throw new ExamError("Deze poging is al ingeleverd");
    questionIds = attempt.questionIds;
  } else {
    // Demo: alleen de vragen uit de eigen, door de server getrokken demo, en binnen de tijd.
    const demo = input.demo;
    if (!demo || !validDemoToken(demo.token, demoToken(user._id, input.pathSlug, questionIds, demo.startedAt))) {
      throw new ExamError("Deze demo is ongeldig. Start hem opnieuw.");
    }
    if (Date.now() > demo.startedAt + exam.timeLimitMinutes * 60_000 + GRACE_MS) {
      throw new ExamError("Deze demo is verlopen. Start hem opnieuw.");
    }
  }

  const questions = questionIds
    .map((id) => exam.questions.find((q) => q.id === id))
    .filter((q): q is ExamQuestion => Boolean(q));
  if (questions.length === 0) throw new ExamError("Geen vragen gevonden");

  const answers = Object.fromEntries(questions.map((q) => [q.id, input.answers[q.id]]));
  const result = gradeExam(questions, answers, exam.passingScore);
  const late = attempt ? Date.now() > attempt.startedAt.getTime() + exam.timeLimitMinutes * 60_000 + GRACE_MS : false;

  let certificateNumber: string | undefined;
  if (attempt) {
    attempt.answers = answers;
    attempt.results = result.results;
    attempt.score = result.score;
    attempt.passed = result.passed && !late;
    attempt.submittedAt = new Date();
    await attempt.save();

    if (attempt.passed) certificateNumber = await issueCertificate(user, input.pathSlug, result.score, attempt._id);
    await evaluateBadges(user._id, user.orgId);
  }

  if (!attempt) {
    // Demo: alleen de score. Juiste antwoorden en uitleg krijg je pas bij een echte poging,
    // anders kun je met demo's de antwoorden verzamelen.
    return {
      result: { score: result.score, points: result.points, total: result.total, passed: result.passed, results: [] },
      questions: questions.map(withoutAnswers),
      late: false,
      certificateNumber: undefined,
      demo: true,
    };
  }
  return { result: { ...result, passed: result.passed && !late }, questions, late, certificateNumber, demo: false };
}

// Crockford-base32 zonder verwarrende tekens (geen I, L, O, U): 10 tekens = 50 bits, niet te raden.
const BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function randomCode(length = 10) {
  return [...randomBytes(length)].map((b) => BASE32[b % 32]).join("");
}

const pathCode: Record<string, string> = { "ai-101": "101", "ui-ux-design": "UX", "software-development": "SD" };

async function issueCertificate(user: Learner, pathSlug: string, score: number, attemptId: Types.ObjectId) {
  const existing = await Certificate.findOne({ userId: user._id, pathSlug }).lean();
  if (existing) return existing.number;

  const [dbUser, path] = await Promise.all([User.findById(user._id).lean(), getLearningPath(pathSlug)]);
  const year = new Date().getFullYear();
  for (let tries = 0; tries < 5; tries++) {
    const number = `AIA-${pathCode[pathSlug] ?? "XX"}-${year}-${randomCode()}`;
    try {
      await Certificate.create({
        number,
        userId: user._id,
        orgId: user.orgId,
        pathSlug,
        holderName: dbUser ? fullName(dbUser) : "",
        score,
        attemptId,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) continue;
      throw error;
    }
    await awardPoints({ userId: user._id, orgId: user.orgId, reason: "certificaat", refId: pathSlug, amount: POINTS.certificaat, label: `Certificaat ${path?.title ?? pathSlug}` });
    await notify({
      userId: user._id,
      orgId: user.orgId,
      type: "certificate",
      title: `Je certificaat voor ${path?.title ?? pathSlug} staat klaar`,
      body: "Download het als pdf of deel het op LinkedIn.",
      href: `/profiel/certificaten/${pathSlug}`,
    });
    return number;
  }
  throw new Error("Kon geen uniek certificaatnummer maken");
}

export async function userAttempts(userId: Types.ObjectId, pathSlug: string) {
  const docs = await ExamAttempt.find({ userId, pathSlug, submittedAt: { $ne: null } }).sort({ submittedAt: 1 }).lean();
  return docs.map((a, i) => ({ number: i + 1, date: a.submittedAt!.toISOString(), score: a.score ?? 0, passed: Boolean(a.passed) }));
}
