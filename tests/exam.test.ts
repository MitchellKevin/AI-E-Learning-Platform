import { describe, expect, it } from "vitest";
import { allChapters, getLearningPath } from "@/lib/content";
import { getExam, type ExamQuestion } from "@/lib/data/exam";
import { Certificate, ExamAttempt, Notification, PointEvent, TaskProgress } from "@/server/models";
import { ExamError, startAttempt, submitAttempt, withoutAnswers } from "@/server/services/exam";
import { createOrgWithUser, setupTestDb } from "./helpers/db";

setupTestDb();

async function completeAi101(user: Awaited<ReturnType<typeof createOrgWithUser>>["user"]) {
  const path = (await getLearningPath("ai-101"))!;
  await TaskProgress.insertMany(
    allChapters(path).flatMap((c) =>
      c.tasks.map((t) => ({ userId: user._id, orgId: user.orgId, pathSlug: "ai-101", chapterId: c.id, taskId: t.id })),
    ),
  );
}

function rightAnswer(q: ExamQuestion) {
  if (q.type === "single") return q.correct;
  if (q.type === "multiple") return q.correct;
  const keywords = q.criteria.flatMap((c) => c.keywords).join(" ");
  return `${keywords} ${"uitleg ".repeat(q.minWords)}`;
}

async function answersFor(attemptQuestionIds: string[], correct: boolean) {
  const exam = (await getExam("ai-101"))!;
  return Object.fromEntries(
    attemptQuestionIds.map((id) => {
      const q = exam.questions.find((x) => x.id === id)!;
      return [id, correct ? rightAnswer(q) : q.type === "open" ? "weet ik niet" : q.type === "single" ? "fout" : ["fout"]];
    }),
  );
}

describe("withoutAnswers", () => {
  it("haalt antwoorden, uitleg en trefwoorden weg", async () => {
    const exam = (await getExam("ai-101"))!;
    for (const q of exam.questions.map(withoutAnswers)) {
      expect(q.explanation).toBe("");
      if (q.type === "single") expect(q.correct).toBe("");
      if (q.type === "multiple") expect(q.correct).toEqual([]);
      if (q.type === "open") {
        expect(q.modelAnswer).toBe("");
        expect(q.criteria.every((c) => c.keywords.length === 0)).toBe(true);
      }
    }
  });
});

describe("eindtoets", () => {
  it("staat zonder afgeronde hoofdstukken alleen een demo toe, zonder iets op te slaan", async () => {
    const { user } = await createOrgWithUser();
    await expect(startAttempt(user, "ai-101", false)).rejects.toBeInstanceOf(ExamError);

    const demo = await startAttempt(user, "ai-101", true);
    expect(demo.attemptId).toBeNull();
    expect(demo.demoToken).toBeTruthy();
    const ids = demo.questions.map((q) => q.id);
    const outcome = await submitAttempt(user, {
      pathSlug: "ai-101",
      attemptId: null,
      questionIds: ids,
      answers: await answersFor(ids, true),
      demo: { token: demo.demoToken!, startedAt: demo.startedAt },
    });
    expect(outcome.demo).toBe(true);
    expect(outcome.result.passed).toBe(true);
    // Geen uitwerking in een demo: anders kun je de antwoorden verzamelen.
    expect(outcome.result.results).toEqual([]);
    for (const q of outcome.questions) {
      expect(q.explanation).toBe("");
      if (q.type === "single") expect(q.correct).toBe("");
      if (q.type === "multiple") expect(q.correct).toEqual([]);
    }
    expect(await ExamAttempt.countDocuments()).toBe(0);
    expect(await Certificate.countDocuments()).toBe(0);
  });

  it("geeft bij slagen een certificaat, 500 punten en een melding", async () => {
    const { user } = await createOrgWithUser();
    await completeAi101(user);

    const started = await startAttempt(user, "ai-101", false);
    expect(started.attemptId).toBeTruthy();
    const ids = (await ExamAttempt.findById(started.attemptId).lean())!.questionIds;

    const outcome = await submitAttempt(user, {
      pathSlug: "ai-101",
      attemptId: started.attemptId,
      // Vraag-id's uit de browser worden genegeerd bij een echte poging.
      questionIds: [],
      answers: await answersFor(ids, true),
    });
    expect(outcome.result.score).toBe(100);
    expect(outcome.certificateNumber).toMatch(/^AIA-101-\d{4}-[0-9A-HJKMNP-TV-Z]{10}$/);
    expect(await Certificate.countDocuments({ userId: user._id })).toBe(1);
    expect(await PointEvent.exists({ userId: user._id, reason: "certificaat", amount: 500 })).toBeTruthy();
    expect(await Notification.exists({ userId: user._id, type: "certificate" })).toBeTruthy();

    // Al geslaagd: geen nieuwe poging.
    await expect(startAttempt(user, "ai-101", false)).rejects.toThrow("al gehaald");
  });

  it("bewaakt het maximum aantal pogingen en levert niet twee keer in", async () => {
    const { user } = await createOrgWithUser();
    await completeAi101(user);
    const exam = (await getExam("ai-101"))!;

    for (let i = 0; i < exam.maxAttempts; i++) {
      const started = await startAttempt(user, "ai-101", false);
      const ids = (await ExamAttempt.findById(started.attemptId).lean())!.questionIds;
      const outcome = await submitAttempt(user, { pathSlug: "ai-101", attemptId: started.attemptId, questionIds: [], answers: await answersFor(ids, false) });
      expect(outcome.result.passed).toBe(false);
      await expect(
        submitAttempt(user, { pathSlug: "ai-101", attemptId: started.attemptId, questionIds: [], answers: {} }),
      ).rejects.toThrow("al ingeleverd");
    }
    await expect(startAttempt(user, "ai-101", false)).rejects.toThrow("geen pogingen");
    expect(await Certificate.countDocuments()).toBe(0);
  });

  it("laat niemand de poging van een ander inleveren", async () => {
    const a = await createOrgWithUser("Noord", "a@noord.nl");
    const b = await createOrgWithUser("Zuid", "b@zuid.nl");
    await completeAi101(a.user);
    const started = await startAttempt(a.user, "ai-101", false);
    await expect(
      submitAttempt(b.user, { pathSlug: "ai-101", attemptId: started.attemptId, questionIds: [], answers: {} }),
    ).rejects.toThrow("niet gevonden");
  });

  it("weigert een demo met zelfgekozen vragen of zonder geldig token", async () => {
    const { user } = await createOrgWithUser();
    const demo = await startAttempt(user, "ai-101", true);
    const exam = (await getExam("ai-101"))!;
    const otherIds = exam.questions.map((q) => q.id).filter((id) => !demo.questions.some((q) => q.id === id)).slice(0, 3);

    await expect(
      submitAttempt(user, { pathSlug: "ai-101", attemptId: null, questionIds: otherIds, answers: {}, demo: { token: demo.demoToken!, startedAt: demo.startedAt } }),
    ).rejects.toThrow("ongeldig");
    await expect(
      submitAttempt(user, { pathSlug: "ai-101", attemptId: null, questionIds: demo.questions.map((q) => q.id), answers: {} }),
    ).rejects.toThrow("ongeldig");
  });

  it("start geen demo meer zodra je de toets echt mag maken", async () => {
    const { user } = await createOrgWithUser();
    await completeAi101(user);
    const started = await startAttempt(user, "ai-101", true);
    expect(started.attemptId).toBeTruthy();
    expect(started.demoToken).toBeNull();
  });
});
