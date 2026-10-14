import {
  mockLeaderboardMembers,
  mockLeaderboardVisible,
  mockMyId,
  mockMyTeam,
  mockPointRules,
} from "@/lib/mock/leaderboard";

// Types en accessors voor het leaderboard.

export type LeaderboardScope = "team" | "organisatie";
export type LeaderboardPeriod = "week" | "maand" | "altijd";

export const leaderboardScopes: LeaderboardScope[] = ["team", "organisatie"];
export const leaderboardPeriods: LeaderboardPeriod[] = ["week", "maand", "altijd"];

export type LeaderboardMember = {
  id: string;
  name: string;
  initials: string;
  team: string;
  streak: number;
  points: Record<LeaderboardPeriod, number>;
  /** Punten zoals ze een week geleden stonden, om de rangwijziging te berekenen. */
  previous: Record<LeaderboardPeriod, number>;
};

export type RankedEntry = {
  id: string;
  name: string;
  initials: string;
  team: string;
  streak: number;
  points: number;
  rank: number;
  /** Plekken gestegen (positief) of gedaald (negatief) t.o.v. vorige week; null = nieuw in deze lijst. */
  change: number | null;
  isMe: boolean;
};

export type LeaderboardBoard = {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  /** Alleen wie in deze periode punten heeft, gesorteerd op rang. */
  entries: RankedEntry[];
  /** Aantal mensen in het team of de organisatie, ook zonder punten. */
  memberCount: number;
  /** Jouw regel, of null als je in deze periode nog geen punten hebt. */
  me: RankedEntry | null;
};

export type TeamAverage = {
  team: string;
  members: number;
  average: number;
  isMine: boolean;
};

export type PointRule = {
  id: "hoofdstuk" | "oefening" | "quiz" | "streak" | "certificaat";
  label: string;
  description: string;
  points: string;
};

export type BoardKey = `${LeaderboardScope}-${LeaderboardPeriod}`;

export type LeaderboardOverview = {
  myTeam: string;
  /** Staat de gebruiker zichtbaar op het leaderboard (instelling). */
  visible: boolean;
  boards: Record<BoardKey, LeaderboardBoard>;
  teams: Record<LeaderboardPeriod, TeamAverage[]>;
};

// Gedeelde plekken bij gelijke punten (1, 2, 2, 4), daarna op naam voor een vaste volgorde.
function rankBy(members: LeaderboardMember[], points: (m: LeaderboardMember) => number) {
  const sorted = members
    .filter((m) => points(m) > 0)
    .sort((a, b) => points(b) - points(a) || a.name.localeCompare(b.name, "nl"));
  const ranks = new Map<string, number>();
  sorted.forEach((m, i) => {
    const prev = sorted[i - 1];
    ranks.set(m.id, prev && points(prev) === points(m) ? ranks.get(prev.id)! : i + 1);
  });
  return { sorted, ranks };
}

function buildBoard(members: LeaderboardMember[], scope: LeaderboardScope, period: LeaderboardPeriod): LeaderboardBoard {
  const now = rankBy(members, (m) => m.points[period]);
  const before = rankBy(members, (m) => m.previous[period]);

  const entries = now.sorted.map<RankedEntry>((m) => {
    const rank = now.ranks.get(m.id)!;
    const previousRank = before.ranks.get(m.id);
    return {
      id: m.id,
      name: m.name,
      initials: m.initials,
      team: m.team,
      streak: m.streak,
      points: m.points[period],
      rank,
      change: previousRank === undefined ? null : previousRank - rank,
      isMe: m.id === mockMyId,
    };
  });

  return { scope, period, entries, memberCount: members.length, me: entries.find((e) => e.isMe) ?? null };
}

function teamAverages(members: LeaderboardMember[], period: LeaderboardPeriod): TeamAverage[] {
  const byTeam = new Map<string, LeaderboardMember[]>();
  for (const m of members) byTeam.set(m.team, [...(byTeam.get(m.team) ?? []), m]);
  return [...byTeam]
    .map(([team, list]) => ({
      team,
      members: list.length,
      average: Math.round(list.reduce((sum, m) => sum + m.points[period], 0) / list.length),
      isMine: team === mockMyTeam,
    }))
    .sort((a, b) => b.average - a.average);
}

// Alle ranglijsten in één keer, zodat wisselen tussen team/organisatie en periode direct gaat.
// Straks één aggregatie-query op MongoDB (punten-events per gebruiker, gegroepeerd per periode).
export async function getLeaderboardOverview(): Promise<LeaderboardOverview> {
  const all = mockLeaderboardMembers;
  const team = all.filter((m) => m.team === mockMyTeam);

  const boards = {} as Record<BoardKey, LeaderboardBoard>;
  const teams = {} as Record<LeaderboardPeriod, TeamAverage[]>;
  for (const period of leaderboardPeriods) {
    boards[`team-${period}`] = buildBoard(team, "team", period);
    boards[`organisatie-${period}`] = buildBoard(all, "organisatie", period);
    teams[period] = teamAverages(all, period);
  }

  return { myTeam: mockMyTeam, visible: mockLeaderboardVisible, boards, teams };
}

// Hoe je punten verdient. Straks uit Storyblok, zodat de puntentabel zonder deploy kan wijzigen.
export async function getPointRules() {
  return mockPointRules;
}
