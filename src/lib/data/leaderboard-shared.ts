// Constanten die ook in client-componenten nodig zijn (zonder de database-code van leaderboard.ts).

export type LeaderboardScope = "team" | "organisatie";
export type LeaderboardPeriod = "week" | "maand" | "altijd";

export const leaderboardScopes: LeaderboardScope[] = ["team", "organisatie"];
export const leaderboardPeriods: LeaderboardPeriod[] = ["week", "maand", "altijd"];
