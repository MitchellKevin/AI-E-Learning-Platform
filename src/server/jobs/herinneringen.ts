import type { Types } from "mongoose";
import { getLearningPath, pathProgress } from "@/lib/content";
import type { Chapter, Progress } from "@/lib/types";
import { ActivityDay, Assignment, Certificate, Organization, TaskProgress, User } from "@/server/models";
import { addDays, dayKey } from "@/server/services/dates";
import { alreadyNotified, notify } from "@/server/services/notifications";
import { currentStreak } from "@/server/services/streak";
import { countInBatches } from "./batch";
import { amsterdamHour, daysBetween, formatDeadline, hourOf, isWeekday, previousDayKey } from "./clock";

// Dagelijkse leerherinnering, streak in gevaar en naderende deadlines.
// Werkt met een run per uur (Vercel Pro, herinnering op de gekozen tijd) en met één run per dag (Hobby):
// alles wat op dat moment aan de beurt is gaat mee, en een dedupeKey per dag voorkomt dubbele meldingen.

/** Vanaf dit uur waarschuwen we dat een streak verloren dreigt te gaan. */
export const STREAK_HOUR = 16;
/** Deadlinemeldingen niet 's nachts (bij een run per uur). */
export const DEADLINE_HOUR = 9;
/** Dagen voor de deadline waarop een melding gaat. */
export const DEADLINE_BUCKETS = [1, 3, 7] as const;

const streakKey = (userId: Types.ObjectId, day: string) => `streak-risico:${userId}:${day}`;

export async function herinneringen(now = new Date()) {
  const today = dayKey(now);
  const orgs = await orgScope();
  // Eerst de streak: wie die waarschuwing vandaag kreeg, krijgt niet ook nog een losse herinnering.
  const streak = await streakWarnings(now, today, orgs);
  const dagelijks = await dailyReminders(now, today, orgs.closing);
  const deadlines = await deadlineReminders(now, today, orgs.closing);
  return { dag: today, dagelijks, streak, deadlines };
}

// Organisaties die verwijderd worden tellen niet mee: daar heeft niemand nog toegang.
async function orgScope() {
  const orgs = await Organization.find({}, { deletionRequestedAt: 1 }).lean();
  return {
    open: orgs.filter((o) => !o.deletionRequestedAt).map((o) => o._id),
    closing: orgs.filter((o) => o.deletionRequestedAt).map((o) => o._id),
  };
}

function learners(closing: Types.ObjectId[], extra: Record<string, unknown> = {}) {
  return User.find(
    {
      status: "actief",
      orgId: { $ne: null, $nin: closing },
      "onboarding.completedAt": { $ne: null },
      deletionRequestedAt: null,
      ...extra,
    },
    { orgId: 1, settings: 1 },
  ).lean();
}

/** Waar iemand verder kan: het eerste open hoofdstuk van het pad waar hij het laatst aan werkte. */
async function continueWhere(userIds: Types.ObjectId[]) {
  const tasks = await TaskProgress.find({ userId: { $in: userIds } }, { userId: 1, pathSlug: 1, chapterId: 1, taskId: 1, completedAt: 1 }).lean();
  const byUser = new Map<string, { progress: Progress; slug: string; at: number }>();
  for (const t of tasks) {
    const entry = byUser.get(String(t.userId)) ?? { progress: { completedTasks: {} }, slug: t.pathSlug, at: -1 };
    (entry.progress.completedTasks[t.chapterId] ??= []).push(t.taskId);
    const at = t.completedAt?.getTime() ?? 0;
    if (at >= entry.at) Object.assign(entry, { at, slug: t.pathSlug });
    byUser.set(String(t.userId), entry);
  }

  const result = new Map<string, { href: string; chapter: Chapter }>();
  for (const [userId, entry] of byUser) {
    const path = await getLearningPath(entry.slug);
    const chapter = path && pathProgress(entry.progress, path).current;
    if (path && chapter) result.set(userId, { href: `/leerpaden/${path.slug}/${chapter.slug}`, chapter });
  }
  return result;
}

async function streakWarnings(now: Date, today: string, orgs: { open: Types.ObjectId[]; closing: Types.ObjectId[] }) {
  if (amsterdamHour(now) < STREAK_HOUR) return 0;

  const yesterday = await ActivityDay.find({ orgId: { $in: orgs.open }, date: previousDayKey(today) }, { userId: 1 }).lean();
  if (!yesterday.length) return 0;
  const users = await learners(orgs.closing, { _id: { $in: yesterday.map((d) => d.userId) } });
  const ids = users.map((u) => u._id);
  const days = await ActivityDay.find({ userId: { $in: ids }, date: { $gte: dayKey(addDays(now, -400)) } }, { userId: 1, date: 1 }).lean();
  const daysByUser = new Map<string, string[]>();
  for (const d of days) {
    const list = daysByUser.get(String(d.userId)) ?? [];
    list.push(d.date);
    daysByUser.set(String(d.userId), list);
  }

  const atRisk = users
    .map((u) => ({ user: u, days: daysByUser.get(String(u._id)) ?? [] }))
    .filter(({ days }) => !days.includes(today))
    .map(({ user, days }) => ({ user, streak: currentStreak(days, now) }))
    .filter(({ streak }) => streak >= 2);
  const next = await continueWhere(atRisk.map(({ user }) => user._id));

  return countInBatches(atRisk, ({ user, streak }) =>
    notify({
      userId: user._id,
      orgId: user.orgId!,
      type: "streak",
      title: `Je streak van ${streak} dagen loopt gevaar`,
      body: "Leer vandaag nog even, dan blijft je reeks staan.",
      href: next.get(String(user._id))?.href ?? "/dashboard",
      dedupeKey: streakKey(user._id, today),
    }),
  );
}

async function dailyReminders(now: Date, today: string, closing: Types.ObjectId[]) {
  if (!isWeekday(now)) return 0;
  const hour = amsterdamHour(now);

  // Standaard staat de herinnering aan; alleen wie hem uitzette (false) slaan we over.
  const users = (await learners(closing, { "settings.learning.dailyReminder": { $ne: false } })).filter(
    (u) => hourOf(u.settings?.learning?.reminderTime) <= hour,
  );
  if (!users.length) return 0;
  const [active, warned] = await Promise.all([
    ActivityDay.find({ userId: { $in: users.map((u) => u._id) }, date: today }, { userId: 1 }).lean(),
    alreadyNotified(users.map((u) => streakKey(u._id, today))),
  ]);
  const learnedToday = new Set(active.map((d) => String(d.userId)));
  const due = users.filter((u) => !learnedToday.has(String(u._id)) && !warned.has(streakKey(u._id, today)));
  const next = await continueWhere(due.map((u) => u._id));

  return countInBatches(due, (u) => {
    const where = next.get(String(u._id));
    return notify({
      userId: u._id,
      orgId: u.orgId!,
      type: "reminder",
      title: "Tijd voor je dagelijkse les",
      body: where
        ? `Ga verder met ${where.chapter.number} ${where.chapter.title}. Een paar minuten is genoeg.`
        : "Een paar minuten per dag houdt je op koers.",
      href: where?.href ?? "/dashboard",
      dedupeKey: `herinnering:${u._id}:${today}`,
    });
  });
}

function deadlineLabel(daysLeft: number) {
  if (daysLeft <= 0) return "vandaag";
  if (daysLeft === 1) return "morgen";
  return `over ${daysLeft} dagen`;
}

async function deadlineReminders(now: Date, today: string, closing: Types.ObjectId[]) {
  if (amsterdamHour(now) < DEADLINE_HOUR) return 0;
  const maxDays = Math.max(...DEADLINE_BUCKETS);
  const assignments = await Assignment.find({
    orgId: { $nin: closing },
    deletedAt: null,
    deadline: { $gt: now, $lte: addDays(now, maxDays + 1) },
  }).lean();

  let sent = 0;
  for (const assignment of assignments) {
    const { deadline } = assignment;
    const path = await getLearningPath(assignment.pathSlug);
    if (!deadline || !path) continue;
    const deadlineDay = dayKey(deadline);
    const daysLeft = daysBetween(today, deadlineDay);
    // Ingedeeld op resterende dagen, zodat een gemiste run de melding niet overslaat.
    const bucket = DEADLINE_BUCKETS.find((b) => daysLeft <= b);
    if (bucket === undefined) continue;

    // Toegewezen: losse collega's plus de actieve leden van de teams, altijd binnen dezelfde organisatie.
    const assignees = await User.find(
      {
        orgId: assignment.orgId,
        status: "actief",
        deletionRequestedAt: null,
        $or: [{ _id: { $in: assignment.userIds } }, { teamId: { $in: assignment.teamIds } }],
      },
      { _id: 1 },
    ).lean();
    if (!assignees.length) continue;
    const ids = assignees.map((u) => u._id);
    const [tasks, certificates] = await Promise.all([
      TaskProgress.find({ userId: { $in: ids }, pathSlug: path.slug }, { userId: 1, chapterId: 1, taskId: 1 }).lean(),
      Certificate.find({ userId: { $in: ids }, pathSlug: path.slug }, { userId: 1 }).lean(),
    ]);
    const certified = new Set(certificates.map((c) => String(c.userId)));
    const progress = new Map<string, Progress>();
    for (const t of tasks) {
      const p = progress.get(String(t.userId)) ?? { completedTasks: {} };
      (p.completedTasks[t.chapterId] ??= []).push(t.taskId);
      progress.set(String(t.userId), p);
    }

    // Op hoofdstukken, niet op het afgeronde percentage: 99,6% is nog niet af.
    const open = ids
      .filter((id) => !certified.has(String(id)))
      .map((id) => ({ id, ...pathProgress(progress.get(String(id)) ?? { completedTasks: {} }, path) }))
      .filter(({ done, total }) => done < total)
      .map(({ id, percent }) => ({ id, percent: Math.min(percent, 99) }));

    sent += await countInBatches(open, ({ id, percent }) =>
      notify({
        userId: id,
        orgId: assignment.orgId,
        type: "assignment",
        title: `Deadline ${deadlineLabel(daysLeft)}: ${path.title}`,
        body: `Rond ${path.title} af vóór ${formatDeadline(deadline)}. Je bent op ${percent}%.`,
        href: `/leerpaden/${path.slug}`,
        // Met de deadlinedag erin: verschuift de deadline, dan tellen de meldingen opnieuw.
        dedupeKey: `deadline:${assignment._id}:${deadlineDay}:${id}:${bucket}`,
      }),
    );
  }
  return sent;
}
