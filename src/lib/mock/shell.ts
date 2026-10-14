import type { ShellAccount, ShellNotificationSeed, ShellPage } from "@/lib/data/shell";

// Tijdelijke data voor de app-shell. Wordt vervangen door Auth.js + MongoDB (zie src/lib/data/shell.ts).

// Demo: Sanne is teammanager van Design én beheerder van Studio Noord, zodat alle schermen te bekijken zijn.
export const mockAccount: ShellAccount = {
  email: "sanne.visser@studionoord.nl",
  team: "Design",
  organisation: "Studio Noord",
  roles: ["cursist", "teammanager", "beheerder"],
};

// Meldingen met een leeftijd in minuten, zodat "2 uur geleden" altijd klopt.
export const mockNotifications: ShellNotificationSeed[] = [
  {
    id: "n-streak",
    type: "streak",
    title: "Je streak van 12 dagen dreigt te verlopen",
    body: "Rond vandaag nog één taak af om je streak te behouden.",
    href: "/leerpaden/ai-101/3-3",
    minutesAgo: 35,
    read: false,
  },
  {
    id: "n-assignment",
    type: "assignment",
    title: "Nieuwe toewijzing: Privacy en vertrouwelijke data",
    body: "Lotte de Wit heeft hoofdstuk 5.1 aan je toegewezen. Deadline: vrijdag 24 oktober.",
    href: "/leerpaden/ai-101/5-1",
    minutesAgo: 140,
    read: false,
  },
  {
    id: "n-certificate",
    type: "certificate",
    title: "Je certificaat voor AI 101 staat klaar",
    body: "Download het als pdf of deel het op LinkedIn.",
    href: "/profiel/certificaten/ai-101",
    minutesAgo: 60 * 30,
    read: false,
  },
  {
    id: "n-badge",
    type: "badge",
    title: "Badge behaald: 7 dagen streak",
    body: "Een week lang elke dag geleerd. Bekijk al je badges op je profiel.",
    href: "/profiel",
    minutesAgo: 60 * 24 * 5,
    read: true,
  },
  {
    id: "n-team",
    type: "team",
    title: "Team Design staat deze maand op plek 2",
    body: "Samen 18.420 punten. Nog 640 punten tot de eerste plek.",
    href: "/leaderboard",
    minutesAgo: 60 * 24 * 3,
    read: true,
  },
  {
    id: "n-team-update",
    type: "team",
    title: "Tim Bakker heeft AI 101 afgerond",
    body: "Hij is als eerste van jullie team begonnen aan UI/UX Design.",
    href: "/leaderboard",
    minutesAgo: 60 * 24 * 6,
    read: true,
  },
];

// Vaste pagina's voor de zoekfunctie. `roles` beperkt wie ze te zien krijgt.
export const mockPages: ShellPage[] = [
  { title: "Dashboard", href: "/dashboard", keywords: "home start overzicht" },
  { title: "Leerpaden", href: "/leerpaden", keywords: "cursussen modules" },
  { title: "Kies je specialisatie", href: "/leerpaden/kies", keywords: "designer developer pad kiezen" },
  { title: "Oefenen", href: "/oefenen", keywords: "prompt playground opdrachten" },
  { title: "Leaderboard", href: "/leaderboard", keywords: "ranglijst punten team" },
  { title: "Mijn profiel", href: "/profiel", keywords: "account badges activiteit" },
  { title: "Certificaten", href: "/profiel/certificaten", keywords: "diploma bewijs linkedin" },
  { title: "Instellingen", href: "/instellingen", context: "Account", keywords: "naam functie account" },
  { title: "Meldingen", href: "/instellingen/meldingen", context: "Instellingen", keywords: "notificaties e-mail herinneringen" },
  { title: "Leren", href: "/instellingen/leren", context: "Instellingen", keywords: "weekdoel focus herinnering" },
  { title: "Privacy", href: "/instellingen/privacy", context: "Instellingen", keywords: "gegevens leaderboard zichtbaarheid export" },
  { title: "Taal", href: "/instellingen/taal", context: "Instellingen", keywords: "language engels nederlands" },
  { title: "Beheer", href: "/beheer", context: "Teammanager", keywords: "manager overzicht", roles: ["teammanager", "beheerder"] },
  { title: "Team", href: "/beheer/team", context: "Beheer", keywords: "teamleden voortgang collega", roles: ["teammanager", "beheerder"] },
  { title: "Toewijzingen", href: "/beheer/toewijzingen", context: "Beheer", keywords: "deadline toewijzen opdracht", roles: ["teammanager", "beheerder"] },
  { title: "Rapportages", href: "/beheer/rapportages", context: "Beheer", keywords: "rapport export voortgang", roles: ["teammanager", "beheerder"] },
  { title: "Gebruikers", href: "/beheer/gebruikers", context: "Beheer", keywords: "uitnodigen licenties rollen", roles: ["beheerder"] },
  { title: "Abonnement", href: "/beheer/abonnement", context: "Beheer", keywords: "facturen betalen stripe licenties", roles: ["beheerder"] },
  { title: "Organisatie", href: "/beheer/organisatie", context: "Beheer", keywords: "bedrijf sso domein", roles: ["beheerder"] },
  { title: "Helpcentrum", href: "/help", keywords: "support vragen faq contact" },
  { title: "Privacyverklaring", href: "/privacy", keywords: "avg gdpr" },
];
