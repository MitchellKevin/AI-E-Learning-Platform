import type { LeaderboardPeriod, LeaderboardScope } from "@/lib/data/leaderboard";

// Teksten per periode en scope, gedeeld door de leaderboard-onderdelen.

export const periodLabels: Record<LeaderboardPeriod, string> = {
  week: "Deze week",
  maand: "Deze maand",
  altijd: "Altijd",
};

// Voor in een zin: "punten deze week", "punten in totaal".
export const periodPhrases: Record<LeaderboardPeriod, string> = {
  week: "deze week",
  maand: "deze maand",
  altijd: "in totaal",
};

export const scopeLabels: Record<LeaderboardScope, string> = {
  team: "Mijn team",
  organisatie: "Organisatie",
};

export const places = (n: number) => `${n} ${n === 1 ? "plek" : "plekken"}`;

// Voorleestekst voor de rangwijziging.
export function changeText(change: number | null) {
  if (change === null) return "nieuw op de ranglijst";
  if (change > 0) return `${places(change)} gestegen t.o.v. vorige week`;
  if (change < 0) return `${places(-change)} gedaald t.o.v. vorige week`;
  return "gelijk gebleven t.o.v. vorige week";
}
