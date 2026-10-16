import { cache } from "react";
import type { Badge, Certificate, LeaderboardEntry, Progress, Stats, User } from "./types";
import { getLeaderboardOverview } from "./data/leaderboard";
import { connectDb } from "@/server/db";
import { ActivityDay, Certificate as CertificateModel, UserBadge, initialsOf } from "@/server/models";
import { requireUser } from "@/server/session";
import { badgeCatalog } from "@/server/services/badges";
import { weekDayKeys } from "@/server/services/dates";
import { totalPoints } from "@/server/services/points";
import { getUserProgress } from "@/server/services/progress";
import { userStreak } from "@/server/services/activity";

// Gebruikersdata van de ingelogde gebruiker, uit MongoDB.

export async function getCurrentUser(): Promise<User> {
  const user = await requireUser();
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    initials: initialsOf(user.firstName, user.lastName, user.email),
  };
}

export const getProgress = cache(async (): Promise<Progress> => {
  const user = await requireUser();
  await connectDb();
  return getUserProgress(user._id);
});

export const getStats = cache(async (): Promise<Stats> => {
  const user = await requireUser();
  await connectDb();
  const keys = weekDayKeys();
  const [streak, points, days, overview] = await Promise.all([
    userStreak(user._id),
    totalPoints(user._id),
    ActivityDay.find({ userId: user._id, date: { $in: keys } }).lean(),
    getLeaderboardOverview(),
  ]);
  const minutesByDay = new Map(days.map((d) => [d.date, d.minutes]));
  return {
    streak,
    points,
    teamRank: overview.boards["team-maand"].me?.rank ?? 0,
    weekMinutes: keys.map((k) => minutesByDay.get(k) || null),
    weekGoal: user.settings?.learning?.weekGoal ?? 120,
  };
});

// Compacte ranglijst voor het dashboard: de top 3, wie net boven je staat en jijzelf.
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { boards } = await getLeaderboardOverview();
  const entries = boards["team-maand"].entries;
  const meIndex = entries.findIndex((e) => e.isMe);
  const picked = entries.filter((_, i) => i < 3 || i === meIndex || i === meIndex - 1);
  return picked.map((e) => ({ rank: e.rank, name: e.name, initials: e.initials, points: e.points, isMe: e.isMe || undefined }));
}

const dashboardBadges = ["01", "7D", "P1", "Q", "101", "30D"];

export async function getBadges(): Promise<{ badges: Badge[]; total: number }> {
  const user = await requireUser();
  await connectDb();
  const earned = new Set((await UserBadge.find({ userId: user._id }, { code: 1 }).lean()).map((b) => b.code));
  return {
    badges: dashboardBadges.map((code) => ({
      code,
      label: badgeCatalog.find((b) => b.code === code)?.label ?? code,
      earned: earned.has(code),
    })),
    total: badgeCatalog.length,
  };
}

export async function getCertificates(): Promise<Certificate[]> {
  const user = await requireUser();
  await connectDb();
  const docs = await CertificateModel.find({ userId: user._id }).sort({ issuedAt: -1 }).lean();
  return docs.map((c) => ({ number: c.number, pathSlug: c.pathSlug, issuedAt: c.issuedAt.toISOString(), score: c.score }));
}

