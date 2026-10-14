import type { Activity, ProfileBadge, ProfileDetails, Settings } from "@/lib/data/profile";

// Tijdelijke profieldata. Wordt vervangen door MongoDB (zie src/lib/data/profile.ts).

export const mockProfile: ProfileDetails = {
  jobTitle: "Product designer",
  team: "Design",
  organisation: "Studio Noord",
  email: "sanne.visser@studionoord.nl",
  loginProvider: "Microsoft",
  memberSince: "2026-03-02",
  longestStreak: 21,
};

// Alle 12 badges. `earned` wordt in de datalaag aangevuld.
export const mockBadgeCatalog: Omit<ProfileBadge, "earned">[] = [
  { code: "01", label: "Eerste hoofdstuk", description: "Rond je eerste hoofdstuk af.", earnedAt: "2026-03-04" },
  { code: "7D", label: "7 dagen streak", description: "Leer zeven dagen achter elkaar.", earnedAt: "2026-10-09" },
  { code: "P1", label: "Promptstarter", description: "Maak je eerste opdracht in Oefenen.", earnedAt: "2026-04-17" },
  {
    code: "Q",
    label: "10 quizzen foutloos",
    description: "Beantwoord tien korte quizzen zonder één fout.",
    earnedAt: "2026-09-22",
  },
  {
    code: "101",
    label: "AI 101 afgerond",
    description: "Rond alle hoofdstukken van AI 101 af.",
    progress: { current: 12, target: 26, unit: "hoofdstukken" },
  },
  {
    code: "30D",
    label: "30 dagen streak",
    description: "Leer dertig dagen achter elkaar.",
    progress: { current: 12, target: 30, unit: "dagen" },
  },
  {
    code: "5K",
    label: "5.000 punten",
    description: "Verzamel in totaal 5.000 punten.",
    progress: { current: 2340, target: 5000, unit: "punten" },
  },
  {
    code: "PRO",
    label: "Promptpro",
    description: "Krijg 25 keer de beoordeling ‘sterk’ op een oefening in Oefenen.",
    progress: { current: 6, target: 25, unit: "oefeningen" },
  },
  {
    code: "T3",
    label: "Top 3",
    description: "Eindig een maand in de top 3 van het leaderboard van je team.",
  },
  {
    code: "ETH",
    label: "Verantwoord bezig",
    description: "Rond het onderwerp Ethiek, veiligheid en verantwoord gebruik af.",
    progress: { current: 0, target: 6, unit: "hoofdstukken" },
  },
  {
    code: "100",
    label: "Foutloze eindtoets",
    description: "Haal 100% op de eindtoets van een leerpad.",
  },
  {
    code: "SP",
    label: "Specialist",
    description: "Rond een specialisatie af: UI/UX Design of Software Development.",
  },
];

export const mockActivity: Activity[] = [
  {
    id: "a1",
    type: "chapter",
    title: "Taak afgerond: Waarom één prompt zelden genoeg is",
    detail: "AI 101 · 3.3 Itereren: een gesprek voeren",
    at: "2026-10-14T09:12:00+02:00",
    points: 20,
    href: "/leerpaden/ai-101/3-3",
  },
  {
    id: "a2",
    type: "certificate",
    title: "Certificaat AI 101 behaald",
    detail: "Eindtoets gehaald met 92%",
    at: "2026-10-13T16:40:00+02:00",
    href: "/profiel/certificaten/ai-101",
  },
  {
    id: "a3",
    type: "chapter",
    title: "Hoofdstuk afgerond: Voorbeelden, rollen en stapsgewijze instructies",
    detail: "AI 101 · 3.2",
    at: "2026-10-13T10:05:00+02:00",
    points: 120,
    href: "/leerpaden/ai-101/3-2",
  },
  {
    id: "a4",
    type: "practice",
    title: "Oefening gedaan: Een klantbriefing samenvatten",
    detail: "Beoordeling: sterk",
    at: "2026-10-12T14:27:00+02:00",
    points: 40,
    href: "/oefenen",
  },
  {
    id: "a5",
    type: "quiz",
    title: "Quiz foutloos: De basis van een goede prompt",
    detail: "AI 101 · 3.1",
    at: "2026-10-11T11:48:00+02:00",
    points: 30,
  },
  {
    id: "a6",
    type: "badge",
    title: "Badge behaald: 7 dagen streak",
    detail: "Zeven dagen achter elkaar geleerd",
    at: "2026-10-09T08:55:00+02:00",
  },
  {
    id: "a7",
    type: "chapter",
    title: "Hoofdstuk afgerond: De basis van een goede prompt",
    detail: "AI 101 · 3.1",
    at: "2026-10-08T15:20:00+02:00",
    points: 120,
    href: "/leerpaden/ai-101/3-1",
  },
];

export const mockSettings: Settings = {
  account: { firstName: "Sanne", lastName: "Visser", jobTitle: "Product designer" },
  learning: { weekGoal: 120, focus: "design", dailyReminder: true, reminderTime: "09:00" },
  notifications: {
    reminders: { email: false, inApp: true },
    streak: { email: true, inApp: true },
    deadlines: { email: true, inApp: true },
    certificates: { email: true, inApp: true },
    productUpdates: { email: false, inApp: false },
  },
  privacy: { showOnLeaderboard: true, visibleToTeam: true },
  language: { locale: "nl" },
};
