import { describe, expect, it } from "vitest";
import { getChapter } from "@/lib/content";
import { ActivityDay, Notification, PointEvent, TaskProgress, UserBadge } from "@/server/models";
import { addDays, dayKey } from "@/server/services/dates";
import { recordActivity } from "@/server/services/activity";
import { completeTask, getUserProgress, recordQuizResult } from "@/server/services/progress";
import { POINTS, totalPoints } from "@/server/services/points";
import { createOrgWithUser, setupTestDb } from "./helpers/db";

setupTestDb();

async function chapter33() {
  const found = await getChapter("ai-101", "3-3");
  return found!.chapter;
}

describe("completeTask", () => {
  it("slaat taken op en kent hoofdstukpunten één keer toe", async () => {
    const { user } = await createOrgWithUser();
    const chapter = await chapter33();

    for (const task of chapter.tasks.slice(0, -1)) {
      const result = await completeTask(user, chapter.id, task.id);
      expect(result.chapterCompleted).toBe(false);
      expect(result.points).toBe(0);
    }
    const last = await completeTask(user, chapter.id, chapter.tasks.at(-1)!.id);
    expect(last.chapterCompleted).toBe(true);
    expect(last.points).toBe(chapter.points);

    // Nog een keer afronden: geen dubbele taak, geen dubbele punten.
    const again = await completeTask(user, chapter.id, chapter.tasks[0].id);
    expect(again.points).toBe(0);
    expect(await TaskProgress.countDocuments({ userId: user._id })).toBe(chapter.tasks.length);
    expect(await totalPoints(user._id)).toBe(chapter.points);

    const progress = await getUserProgress(user._id);
    expect(progress.completedTasks[chapter.id]).toHaveLength(chapter.tasks.length);
  });

  it("geeft de badge 'Eerste hoofdstuk' na het eerste afgeronde hoofdstuk", async () => {
    const { user } = await createOrgWithUser();
    const chapter = await chapter33();
    let badges: string[] = [];
    for (const task of chapter.tasks) badges = (await completeTask(user, chapter.id, task.id)).badges;
    expect(badges).toContain("01");
    expect(await UserBadge.exists({ userId: user._id, code: "01" })).toBeTruthy();
    expect(await Notification.exists({ userId: user._id, type: "badge" })).toBeTruthy();
  });

  it("weigert onbekende taken", async () => {
    const { user } = await createOrgWithUser();
    await expect(completeTask(user, "ai-101/3-3", "bestaat-niet")).rejects.toThrow("Onbekende taak");
    await expect(completeTask(user, "nep/9-9", "intro")).rejects.toThrow("Onbekende taak");
  });

  it("telt de dag mee voor de streak", async () => {
    const { user } = await createOrgWithUser();
    const chapter = await chapter33();
    await completeTask(user, chapter.id, chapter.tasks[0].id);
    expect(await ActivityDay.exists({ userId: user._id, date: dayKey() })).toBeTruthy();
  });
});

describe("recordQuizResult", () => {
  it("geeft alleen punten bij de eerste poging, en maar één keer", async () => {
    const { user } = await createOrgWithUser();
    expect(await recordQuizResult(user, "ai-101/3-3", "quiz", false)).toBe(0);
    expect(await recordQuizResult(user, "ai-101/3-3", "quiz", true)).toBe(POINTS.quiz);
    expect(await recordQuizResult(user, "ai-101/3-3", "quiz", true)).toBe(0);
    expect(await PointEvent.countDocuments({ userId: user._id, reason: "quiz" })).toBe(1);
  });
});

describe("recordActivity", () => {
  it("geeft een streakbonus op dag 7", async () => {
    const { user } = await createOrgWithUser();
    await ActivityDay.insertMany(
      [1, 2, 3, 4, 5, 6].map((n) => ({ userId: user._id, orgId: user.orgId, date: dayKey(addDays(new Date(), -n)), minutes: 10 })),
    );
    await recordActivity(user._id, user.orgId, 5);
    expect(await PointEvent.countDocuments({ userId: user._id, reason: "streak" })).toBe(1);

    // Later op dezelfde dag: geen tweede bonus, wel minuten erbij.
    await recordActivity(user._id, user.orgId, 3);
    expect(await PointEvent.countDocuments({ userId: user._id, reason: "streak" })).toBe(1);
    const today = await ActivityDay.findOne({ userId: user._id, date: dayKey() }).lean();
    expect(today?.minutes).toBe(8);
  });
});
