import type { LeaderboardMember, PointRule } from "@/lib/data/leaderboard";

// Tijdelijke leaderboard-data voor Studio Noord. Wordt vervangen door MongoDB (zie src/lib/data/leaderboard.ts).

export const mockMyId = "u_sanne";
export const mockMyTeam = "Design";

// Staat de huidige gebruiker op het leaderboard? Komt straks uit de instellingen.
export const mockLeaderboardVisible = true;

// [id, naam, initialen, team, streak, deze week, vorige week, deze maand, altijd]
type Row = [string, string, string, string, number, number, number, number, number];

const rows: Row[] = [
  // Design
  ["u_tim", "Tim Bakker", "TB", "Design", 31, 640, 820, 4120, 11840],
  ["u_lisa", "Lisa de Jong", "LJ", "Design", 18, 720, 690, 3870, 9620],
  ["u_mo", "Mo Kaddouri", "MK", "Design", 9, 380, 910, 3540, 8310],
  ["u_noor", "Noor Jansen", "NJ", "Design", 14, 510, 600, 3310, 7450],
  ["u_daan", "Daan Smit", "DS", "Design", 6, 290, 540, 3180, 10210],
  ["u_fleur", "Fleur Mulder", "FM", "Design", 22, 560, 480, 3050, 6890],
  ["u_jesse", "Jesse de Vries", "JV", "Design", 4, 210, 650, 2920, 8730],
  ["u_yara", "Yara El Amrani", "YE", "Design", 11, 470, 390, 2860, 5120],
  ["u_bram", "Bram Peeters", "BP", "Design", 3, 160, 520, 2740, 9980],
  ["u_iris", "Iris van Dijk", "ID", "Design", 16, 430, 410, 2650, 6040],
  ["u_ruben", "Ruben Bos", "RB", "Design", 0, 0, 470, 2580, 7310],
  ["u_lotte", "Lotte Meijer", "LM", "Design", 8, 340, 300, 2470, 4420],
  ["u_eva", "Eva Hendriks", "EH", "Design", 5, 260, 380, 2410, 5680],
  ["u_sanne", "Sanne Visser", "SV", "Design", 12, 650, 460, 2340, 2340],
  ["u_thijs", "Thijs Kok", "TK", "Design", 0, 0, 260, 1720, 3910],
  // Development
  ["u_kevin", "Kevin Janssen", "KJ", "Development", 19, 590, 760, 3720, 10870],
  ["u_sophie", "Sophie de Boer", "SB", "Development", 25, 680, 540, 3460, 8120],
  ["u_ahmed", "Ahmed Yilmaz", "AY", "Development", 7, 240, 470, 2980, 6730],
  ["u_julia", "Julia van den Berg", "JB", "Development", 10, 410, 350, 2290, 5340],
  ["u_max", "Max de Graaf", "MG", "Development", 1, 90, 310, 1640, 4870],
  ["u_nina", "Nina Dekker", "ND", "Development", 3, 330, 0, 330, 330],
  // Strategie
  ["u_wouter", "Wouter Brouwer", "WB", "Strategie", 6, 300, 420, 2520, 6210],
  ["u_esra", "Esra Demir", "ED", "Strategie", 13, 450, 380, 2760, 4980],
  ["u_maud", "Maud Verhoeven", "MV", "Strategie", 0, 0, 180, 1260, 3640],
];

// Per periode de huidige punten en de stand van een week eerder (voor de stijgers en dalers).
export const mockLeaderboardMembers: LeaderboardMember[] = rows.map(
  ([id, name, initials, team, streak, week, lastWeek, month, allTime]) => ({
    id,
    name,
    initials,
    team,
    streak,
    points: { week, maand: month, altijd: allTime },
    previous: { week: lastWeek, maand: month - week, altijd: allTime - week },
  }),
);

export const mockPointRules: PointRule[] = [
  { id: "hoofdstuk", label: "Hoofdstuk afronden", description: "Alle taken van een hoofdstuk voltooid.", points: "+120" },
  {
    id: "oefening",
    label: "Oefening in Oefenen",
    description: "Een promptopdracht ingeleverd en feedback bekeken.",
    points: "+40",
  },
  { id: "quiz", label: "Kennischeck foutloos", description: "Alle vragen in één keer goed.", points: "+25" },
  { id: "streak", label: "Streakbonus", description: "Elke 7 dagen op rij dat je leert.", points: "+50" },
  { id: "certificaat", label: "Certificaat behalen", description: "Eindtoets van een leerpad gehaald.", points: "+500" },
];
