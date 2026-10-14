import { ai101 } from "./mock-content";
import type { Badge, Certificate, LeaderboardEntry, Progress, Stats, User } from "./types";

// Tijdelijke gebruikersdata. Wordt vervangen door MongoDB (zie src/lib/user-data.ts).

export const mockUser: User = {
  id: "u_sanne",
  firstName: "Sanne",
  lastName: "Visser",
  initials: "SV",
};

const allTasks = (slugs: string[]) =>
  Object.fromEntries(
    ai101.topics
      .flatMap((t) => t.chapters)
      .filter((c) => slugs.includes(c.slug))
      .map((c) => [c.id, c.tasks.map((t) => t.id)]),
  );

export const mockProgress: Progress = {
  completedTasks: {
    ...allTasks(["1-1", "1-2", "1-3", "1-4", "1-5", "2-1", "2-2", "2-3", "2-4", "2-5", "3-1", "3-2"]),
    "ai-101/3-3": ["introductie", "een-prompt"],
  },
};

export const mockStats: Stats = {
  streak: 12,
  points: 2340,
  teamRank: 14,
  weekMinutes: [20, 35, null, 15, 25, 10, null],
  weekGoal: 120,
};

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Tim Bakker", initials: "TB", points: 4120 },
  { rank: 2, name: "Lisa de Jong", initials: "LJ", points: 3870 },
  { rank: 3, name: "Mo Kaddouri", initials: "MK", points: 3540 },
  { rank: 13, name: "Eva Hendriks", initials: "EH", points: 2410 },
  { rank: 14, name: "Sanne Visser", initials: "SV", points: 2340, isMe: true },
];

export const mockBadges: Badge[] = [
  { code: "01", label: "Eerste hoofdstuk", earned: true },
  { code: "7D", label: "7 dagen streak", earned: true },
  { code: "P1", label: "Promptstarter", earned: true },
  { code: "Q", label: "10 quizzen foutloos", earned: true },
  { code: "101", label: "AI 101 afgerond", earned: false },
  { code: "30D", label: "30 dagen streak", earned: false },
];

export const mockBadgeTotal = 12;

// Demo-certificaat zodat het certificaatscherm te bekijken is.
export const mockCertificates: Certificate[] = [
  { number: "AIA-101-2026-0482", pathSlug: "ai-101", issuedAt: "2026-10-13", score: 92 },
];
