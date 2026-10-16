import type { Types } from "mongoose";
import { ActivityDay } from "@/server/models";
import { dayKey } from "./dates";
import { currentStreak } from "./streak";
import { POINTS, awardPoints } from "./points";
import { notify } from "./notifications";

// Leertijd en streaks. Elke dag met activiteit telt mee voor de streak; elke 7 dagen op rij geeft een bonus.

export async function userActivityDays(userId: Types.ObjectId) {
  const docs = await ActivityDay.find({ userId }, { date: 1, minutes: 1 }).lean();
  return docs;
}

export async function userStreak(userId: Types.ObjectId) {
  const days = await ActivityDay.find({ userId }, { date: 1 }).lean();
  return currentStreak(days.map((d) => d.date));
}

/** Registreert activiteit voor vandaag (minutes mag 0 zijn: dan telt alleen de dag mee). */
export async function recordActivity(userId: Types.ObjectId, orgId: Types.ObjectId, minutes = 0) {
  const today = dayKey();
  const result = await ActivityDay.updateOne(
    { userId, date: today },
    { $inc: { minutes }, $setOnInsert: { orgId } },
    { upsert: true },
  );

  // Alleen bij de eerste activiteit van de dag kan de streak een mijlpaal bereiken.
  if (result.upsertedCount > 0) {
    const streak = await userStreak(userId);
    if (streak > 0 && streak % 7 === 0) {
      const awarded = await awardPoints({
        userId,
        orgId,
        reason: "streak",
        refId: `${today}-${streak}`,
        amount: POINTS.streak,
        label: `${streak} dagen op rij`,
      });
      if (awarded) {
        await notify({
          userId,
          orgId,
          type: "streak",
          title: `${streak} dagen op rij geleerd`,
          body: `Sterk volgehouden! Je krijgt ${POINTS.streak} bonuspunten.`,
          href: "/profiel",
        });
      }
    }
  }
}
