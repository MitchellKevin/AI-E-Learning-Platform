import type { Types } from "mongoose";
import { LeaderboardSnapshot, Organization, PointEvent, Team, User, UserBadge, fullName } from "@/server/models";
import { notify } from "@/server/services/notifications";
import { previousMonth } from "./clock";

// Maandstand van het leaderboard: per team (en voor de hele organisatie) een momentopname van de afgesloten maand.
// De top 3 van elk team krijgt de badge "Top 3". Draait dagelijks; staat de maand er al, dan gebeurt er niets.

type Entry = { userId: Types.ObjectId; rank: number; points: number };
type Month = ReturnType<typeof previousMonth>;

const isDuplicate = (error: unknown) => (error as { code?: number }).code === 11000;

/** Rangschikt op punten (hoog naar laag); gelijke punten delen een plek. */
export function rankMembers(members: { _id: Types.ObjectId; name: string }[], points: Map<string, number>): Entry[] {
  const sorted = members
    .map((m) => ({ userId: m._id, name: m.name, points: points.get(String(m._id)) ?? 0 }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "nl"));
  const entries: Entry[] = [];
  sorted.forEach((m, i) => {
    const rank = i > 0 && m.points === sorted[i - 1].points ? entries[i - 1].rank : i + 1;
    entries.push({ userId: m.userId, rank, points: m.points });
  });
  return entries;
}

// Slaat de momentopname één keer op. Bestaat hij al, dan gelden de punten die toen zijn vastgelegd.
async function ensureSnapshot(orgId: Types.ObjectId, teamId: Types.ObjectId | undefined, month: string, entries: Entry[]) {
  try {
    await LeaderboardSnapshot.create({ orgId, teamId, month, entries });
    return { created: true, entries };
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    const existing = await LeaderboardSnapshot.findOne({ orgId, teamId: teamId ?? null, month }).lean();
    return { created: false, entries: (existing?.entries ?? []) as Entry[] };
  }
}

// Badge één keer; wie hem al had krijgt alleen een melding. Geeft aan of de badge nieuw is.
async function awardTop3(userId: Types.ObjectId, month: Month, now: Date) {
  try {
    await UserBadge.create({ userId, code: "T3", earnedAt: now });
    return true;
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    // Verdiend na afloop van deze maand: dan hoort hij bij deze stand (een eerdere run brak af na de badge).
    const badge = await UserBadge.findOne({ userId, code: "T3" }, { earnedAt: 1 }).lean();
    return Boolean(badge?.earnedAt && badge.earnedAt >= month.end);
  }
}

export async function leaderboardMaand(now = new Date()) {
  const month = previousMonth(now);
  const summary = { maand: month.key, organisaties: 0, momentopnames: 0, badges: 0, meldingen: 0 };
  const orgs = await Organization.find({ deletionRequestedAt: null }, { _id: 1 }).lean();

  for (const org of orgs) {
    // De stand van de hele organisatie slaan we als laatste op: staat die er, dan is deze maand klaar.
    if (await LeaderboardSnapshot.exists({ orgId: org._id, teamId: null, month: month.key })) continue;
    summary.organisaties++;

    const [users, teams, sums] = await Promise.all([
      // Wie zich afmeldde voor het leaderboard of om verwijdering vroeg, komt niet in de stand.
      User.find(
        { orgId: org._id, status: "actief", deletionRequestedAt: null, "settings.privacy.showOnLeaderboard": { $ne: false } },
        { firstName: 1, lastName: 1, email: 1, teamId: 1 },
      ).lean(),
      Team.find({ orgId: org._id }, { name: 1 }).lean(),
      PointEvent.aggregate<{ _id: Types.ObjectId; points: number }>([
        { $match: { orgId: org._id, createdAt: { $gte: month.start, $lt: month.end } } },
        { $group: { _id: "$userId", points: { $sum: "$amount" } } },
      ]),
    ]);
    const points = new Map(sums.map((s) => [String(s._id), s.points]));
    const members = users.map((u) => ({ _id: u._id, teamId: u.teamId, name: fullName(u) }));

    for (const team of teams) {
      const teamMembers = members.filter((m) => m.teamId && team._id.equals(m.teamId));
      if (!teamMembers.length) continue;
      const snapshot = await ensureSnapshot(org._id, team._id, month.key, rankMembers(teamMembers, points));
      if (snapshot.created) summary.momentopnames++;

      for (const entry of snapshot.entries.filter((e) => e.rank <= 3 && e.points > 0)) {
        const fresh = await awardTop3(entry.userId, month, now);
        if (fresh) summary.badges++;
        const sent = await notify({
          userId: entry.userId,
          orgId: org._id,
          type: "badge",
          title: fresh ? "Badge behaald: Top 3" : `Weer in de top 3 van ${team.name}`,
          body: `Je eindigde in ${month.label} op plek ${entry.rank} in team ${team.name}, met ${entry.points.toLocaleString("nl-NL")} punten.`,
          href: "/profiel",
          dedupeKey: `top3:${month.key}:${entry.userId}`,
        });
        if (sent) summary.meldingen++;
      }
    }

    const overall = await ensureSnapshot(org._id, undefined, month.key, rankMembers(members, points));
    if (overall.created) summary.momentopnames++;
  }
  return summary;
}
