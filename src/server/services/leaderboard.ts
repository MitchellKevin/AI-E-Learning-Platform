import type { Types } from "mongoose";
import type { LeaderboardMember } from "@/lib/data/leaderboard";
import { ActivityDay, PointEvent, Team, User, initialsOf } from "@/server/models";
import { addDays, startOfMonth, startOfWeek } from "./dates";
import { currentStreak } from "./streak";

// Punten per collega per periode, plus de stand van een week eerder (voor stijgers en dalers).

type Sums = { week: number; prevWeek: number; month: number; monthBefore: number; all: number; allBefore: number };

export async function leaderboardMembers(orgId: Types.ObjectId, viewerId: Types.ObjectId, now = new Date()): Promise<LeaderboardMember[]> {
  const weekStart = startOfWeek(now);
  const prevWeekStart = addDays(weekStart, -7);
  const monthStart = startOfMonth(now);
  const weekAgo = addDays(now, -7);

  const [users, teams, sums, days] = await Promise.all([
    User.find({ orgId, status: "actief" }, { firstName: 1, lastName: 1, email: 1, teamId: 1, settings: 1 }).lean(),
    Team.find({ orgId }).lean(),
    PointEvent.aggregate<Sums & { _id: Types.ObjectId }>([
      { $match: { orgId } },
      {
        $group: {
          _id: "$userId",
          all: { $sum: "$amount" },
          allBefore: { $sum: { $cond: [{ $lt: ["$createdAt", weekAgo] }, "$amount", 0] } },
          month: { $sum: { $cond: [{ $gte: ["$createdAt", monthStart] }, "$amount", 0] } },
          monthBefore: {
            $sum: { $cond: [{ $and: [{ $gte: ["$createdAt", monthStart] }, { $lt: ["$createdAt", weekAgo] }] }, "$amount", 0] },
          },
          week: { $sum: { $cond: [{ $gte: ["$createdAt", weekStart] }, "$amount", 0] } },
          prevWeek: {
            $sum: { $cond: [{ $and: [{ $gte: ["$createdAt", prevWeekStart] }, { $lt: ["$createdAt", weekStart] }] }, "$amount", 0] },
          },
        },
      },
    ]),
    ActivityDay.find({ orgId, date: { $gte: addDays(now, -400).toISOString().slice(0, 10) } }, { userId: 1, date: 1 }).lean(),
  ]);

  const teamName = new Map(teams.map((t) => [String(t._id), t.name]));
  const byUser = new Map(sums.map((s) => [String(s._id), s]));
  const daysByUser = new Map<string, string[]>();
  for (const d of days) daysByUser.set(String(d.userId), [...(daysByUser.get(String(d.userId)) ?? []), d.date]);

  return users
    // Wie zich afmeldt voor het leaderboard verdwijnt bij collega's; zelf zie je je eigen regel wel.
    .filter((u) => u.settings?.privacy?.showOnLeaderboard !== false || u._id.equals(viewerId))
    .map((u) => {
      const s = byUser.get(String(u._id));
      return {
        id: String(u._id),
        name: `${u.firstName} ${u.lastName}`.trim() || u.email,
        initials: initialsOf(u.firstName, u.lastName, u.email),
        team: teamName.get(String(u.teamId)) ?? "",
        streak: currentStreak(daysByUser.get(String(u._id)) ?? [], now),
        points: { week: s?.week ?? 0, maand: s?.month ?? 0, altijd: s?.all ?? 0 },
        previous: { week: s?.prevWeek ?? 0, maand: s?.monthBefore ?? 0, altijd: s?.allBefore ?? 0 },
      };
    });
}
