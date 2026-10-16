import type { Types } from "mongoose";
import { getLearningPaths, pathProgress } from "@/lib/content";
import type {
  MockAssignment,
  MockExamAttempt,
  MockMember,
  MonthlyHours,
  PathSlug,
  PeriodSummary,
  ReportPeriod,
  WeeklyActivity,
} from "@/lib/data/admin-team";
import type { Progress } from "@/lib/types";
import {
  ActivityDay,
  Assignment,
  Certificate,
  Enrollment,
  ExamAttempt,
  Invite,
  Organization,
  PointEvent,
  TaskProgress,
  Team,
  User,
  initialsOf,
} from "@/server/models";
import { addDays, dayKey, startOfWeek } from "./dates";
import { currentStreak } from "./streak";

// Bronnen voor het teambeheer, opgebouwd uit MongoDB in dezelfde vorm als de oude mockdata.
// De rekenlogica (status, achterstand, rapportages) in src/lib/data/admin-team.ts blijft daardoor gelijk.

export type AdminSource = {
  today: string;
  organization: { name: string; plan: string; seats: number };
  members: MockMember[];
  assignments: MockAssignment[];
  examAttempts: MockExamAttempt[];
  weekly: WeeklyActivity[];
  monthly: MonthlyHours[];
  summaries: Record<ReportPeriod, PeriodSummary>;
  teams: string[];
};

const planLabel: Record<string, string> = { starter: "Starter", team: "Team", enterprise: "Enterprise" };

function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export async function loadAdminSource(orgId: Types.ObjectId, now = new Date()): Promise<AdminSource> {
  const today = dayKey(now);
  const yearAgo = dayKey(addDays(now, -730));

  const [org, teams, users, invites, assignments, progress, certificates, enrollments, attempts, days, chapterEvents, paths] =
    await Promise.all([
      Organization.findById(orgId).lean(),
      Team.find({ orgId }).sort({ name: 1 }).lean(),
      User.find({ orgId, status: "actief" }).lean(),
      Invite.find({ orgId, acceptedAt: null, revokedAt: null, expiresAt: { $gt: now } }).lean(),
      Assignment.find({ orgId, deletedAt: null }).lean(),
      TaskProgress.find({ orgId }, { userId: 1, chapterId: 1, taskId: 1 }).lean(),
      Certificate.find({ orgId }).lean(),
      Enrollment.find({ orgId }).lean(),
      ExamAttempt.find({ orgId, submittedAt: { $ne: null } }).lean(),
      ActivityDay.find({ orgId, date: { $gte: yearAgo } }).lean(),
      PointEvent.find({ orgId, reason: "hoofdstuk", createdAt: { $gte: addDays(now, -730) } }, { createdAt: 1 }).lean(),
      getLearningPaths(),
    ]);
  if (!org) throw new Error("Organisatie niet gevonden");

  const teamName = new Map(teams.map((t) => [String(t._id), t.name]));
  const pointsByUser = new Map<string, number>();
  for (const e of await PointEvent.aggregate<{ _id: Types.ObjectId; total: number }>([
    { $match: { orgId } },
    { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  ])) {
    pointsByUser.set(String(e._id), e.total);
  }

  const progressByUser = new Map<string, Progress>();
  for (const p of progress) {
    const entry = progressByUser.get(String(p.userId)) ?? { completedTasks: {} };
    (entry.completedTasks[p.chapterId] ??= []).push(p.taskId);
    progressByUser.set(String(p.userId), entry);
  }
  const daysByUser = new Map<string, { date: string; minutes: number }[]>();
  for (const d of days) daysByUser.set(String(d.userId), [...(daysByUser.get(String(d.userId)) ?? []), d]);

  // Wie moet welk pad volgen: persoonlijk of via het team toegewezen.
  const assigneesOf = (a: (typeof assignments)[number]) =>
    users
      .filter((u) => a.userIds.some((id) => id.equals(u._id)) || (u.teamId && a.teamIds.some((id) => id.equals(u.teamId!))))
      .map((u) => String(u._id));

  const monthAgo = dayKey(addDays(now, -28));
  const members: MockMember[] = users.map((u) => {
    const id = String(u._id);
    const userProgress = progressByUser.get(id) ?? { completedTasks: {} };
    const userDays = daysByUser.get(id) ?? [];
    const certs = certificates.filter((c) => c.userId.equals(u._id));
    const relevant = new Set<string>(["ai-101"]);
    for (const a of assignments) if (assigneesOf(a).includes(id)) relevant.add(a.pathSlug);
    for (const e of enrollments) if (e.userId.equals(u._id)) relevant.add(e.pathSlug);
    for (const c of certs) relevant.add(c.pathSlug);

    return {
      id,
      name: `${u.firstName} ${u.lastName}`.trim() || u.email,
      initials: initialsOf(u.firstName, u.lastName, u.email),
      email: u.email,
      team: teamName.get(String(u.teamId)) ?? "",
      role: u.jobTitle ?? "",
      lastActiveAt: u.lastActiveAt ? dayKey(u.lastActiveAt) : dayKey(u.createdAt),
      minutesPerWeek: Math.round(userDays.filter((d) => d.date >= monthAgo).reduce((s, d) => s + d.minutes, 0) / 4),
      points: pointsByUser.get(id) ?? 0,
      streak: currentStreak(userDays.map((d) => d.date), now),
      paths: paths
        .filter((p) => relevant.has(p.slug))
        .map((p) => {
          const cert = certs.find((c) => c.pathSlug === p.slug);
          return {
            slug: p.slug as PathSlug,
            progress: cert ? 100 : pathProgress(userProgress, p).percent,
            completedAt: cert ? dayKey(cert.issuedAt) : undefined,
            examScore: cert?.score,
          };
        }),
    };
  });

  // Open uitnodigingen tellen mee als lid zonder activiteit.
  for (const invite of invites) {
    members.push({
      id: `inv_${invite._id}`,
      name: invite.email,
      initials: invite.email[0].toUpperCase(),
      email: invite.email,
      team: teamName.get(String(invite.teamId)) ?? "",
      role: "",
      lastActiveAt: null,
      invitedAt: dayKey(invite.createdAt),
      minutesPerWeek: 0,
      points: 0,
      streak: 0,
      paths: [{ slug: "ai-101", progress: 0 }],
    });
  }

  const mockAssignments: MockAssignment[] = assignments.map((a) => ({
    id: String(a._id),
    pathSlug: a.pathSlug as PathSlug,
    target: a.teamIds.length
      ? { kind: "team", teams: a.teamIds.map((t) => teamName.get(String(t)) ?? "") }
      : { kind: "people" },
    memberIds: assigneesOf(a),
    createdAt: dayKey(a.createdAt),
    deadline: a.deadline ? dayKey(a.deadline) : today,
    required: a.required ?? false,
    message: a.message ?? undefined,
  }));

  const examAttempts: MockExamAttempt[] = attempts.map((a) => ({
    memberId: String(a.userId),
    pathSlug: a.pathSlug as PathSlug,
    date: dayKey(a.submittedAt!),
    score: a.score ?? 0,
  }));

  // Leertijd per week (13 weken) en per maand (12 maanden).
  const weekly: WeeklyActivity[] = Array.from({ length: 13 }, (_, i) => {
    const start = addDays(startOfWeek(now), -7 * (12 - i));
    const from = dayKey(start);
    const to = dayKey(addDays(start, 6));
    const inWeek = days.filter((d) => d.date >= from && d.date <= to);
    return {
      week: isoWeek(addDays(start, 3)),
      start: from,
      minutes: inWeek.reduce((s, d) => s + d.minutes, 0),
      activeLearners: new Set(inWeek.map((d) => String(d.userId))).size,
    };
  });
  const monthly: MonthlyHours[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const minutes = days.filter((x) => x.date.startsWith(month)).reduce((s, x) => s + x.minutes, 0);
    return { month, hours: Math.round((minutes / 60) * 10) / 10 };
  });

  const window = (daysBack: number, offset = 0) => {
    const to = addDays(now, -offset);
    const from = addDays(to, -daysBack);
    const inRange = days.filter((d) => d.date > dayKey(from) && d.date <= dayKey(to));
    return {
      completedChapters: chapterEvents.filter((e) => e.createdAt > from && e.createdAt <= to).length,
      activeLearners: new Set(inRange.map((d) => String(d.userId))).size,
      hours: Math.round(inRange.reduce((s, d) => s + d.minutes, 0) / 60),
    };
  };
  const summary = (n: number): PeriodSummary => {
    const current = window(n);
    const previous = window(n, n);
    return {
      completedChapters: { current: current.completedChapters, previous: previous.completedChapters },
      activeLearners: { current: current.activeLearners, previous: previous.activeLearners },
      hours: { current: current.hours, previous: previous.hours },
    };
  };

  return {
    today,
    organization: { name: org.name, plan: planLabel[org.plan ?? "team"] ?? "Team", seats: org.seats ?? 0 },
    members,
    assignments: mockAssignments,
    examAttempts,
    weekly,
    monthly,
    summaries: { "30d": summary(30), "90d": summary(90), "12m": summary(365) },
    teams: teams.map((t) => t.name),
  };
}
