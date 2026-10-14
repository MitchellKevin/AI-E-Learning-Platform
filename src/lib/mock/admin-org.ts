import type {
  AuditEntry,
  BillingDetails,
  DomainSettings,
  Invoice,
  OrgProfile,
  OrgRole,
  OrgUser,
  PaymentMethod,
  PrivacySettings,
  SsoConnection,
  Subscription,
  UserStatus,
} from "@/lib/data/admin-org";

// Tijdelijke beheerdata van Studio Noord. Wordt vervangen door MongoDB en Stripe (zie src/lib/data/admin-org.ts).

// Zelfde organisatie, teams en mensen als in src/lib/mock/admin-team.ts, zodat beheer één geheel is.
export const mockTeams = ["Design", "Development", "Strategie"];

type Row = [name: string, team: string, role: OrgRole, status: UserStatus, date: string];

// [naam, team, rol, status, laatst actief / gedeactiveerd op]
const rows: Row[] = [
  ["Sanne Visser", "Design", "beheerder", "actief", "2026-10-14T08:12:00Z"],
  ["Lotte Meijer", "Design", "teammanager", "actief", "2026-10-13T15:40:00Z"],
  ["Tim Bakker", "Design", "cursist", "actief", "2026-10-14T09:02:00Z"],
  ["Lisa de Jong", "Design", "cursist", "actief", "2026-10-14T07:21:00Z"],
  ["Mo Kaddouri", "Design", "cursist", "actief", "2026-10-12T16:48:00Z"],
  ["Noor Jansen", "Design", "cursist", "actief", "2026-10-11T10:30:00Z"],
  ["Daan Smit", "Design", "cursist", "actief", "2026-10-08T13:05:00Z"],
  ["Fleur Mulder", "Design", "cursist", "actief", "2026-10-13T11:05:00Z"],
  ["Jesse de Vries", "Design", "cursist", "actief", "2026-09-24T16:22:00Z"],
  ["Yara El Amrani", "Design", "cursist", "actief", "2026-10-10T08:40:00Z"],
  ["Iris van Dijk", "Design", "cursist", "actief", "2026-10-13T14:15:00Z"],
  ["Ruben Bos", "Design", "cursist", "actief", "2026-09-18T09:45:00Z"],
  ["Eva Hendriks", "Design", "cursist", "actief", "2026-10-09T13:10:00Z"],
  ["Kevin Janssen", "Development", "teammanager", "actief", "2026-10-14T06:55:00Z"],
  ["Sophie de Boer", "Development", "cursist", "actief", "2026-10-13T20:02:00Z"],
  ["Ahmed Yilmaz", "Development", "cursist", "actief", "2026-10-06T12:30:00Z"],
  ["Julia van den Berg", "Development", "cursist", "actief", "2026-10-12T17:44:00Z"],
  ["Max de Graaf", "Development", "cursist", "actief", "2026-09-27T15:00:00Z"],
  ["Nina Dekker", "Development", "cursist", "actief", "2026-10-14T07:20:00Z"],
  ["Esra Demir", "Strategie", "beheerder", "actief", "2026-10-11T10:10:00Z"],
  ["Wouter Brouwer", "Strategie", "cursist", "actief", "2026-10-02T08:35:00Z"],
  ["Bas Vermeulen", "Development", "cursist", "gedeactiveerd", "2026-08-31T16:00:00Z"],
  ["Anouk Smit", "Strategie", "cursist", "gedeactiveerd", "2026-07-15T10:00:00Z"],
];

// "Julia van den Berg" -> "julia@studionoord.nl"; oud-collega's kregen nog voornaam.achternaam.
const emailFor = (name: string, status: UserStatus) => {
  const parts = name.toLowerCase().split(" ");
  return status === "gedeactiveerd"
    ? `${parts[0]}.${parts.slice(1).join("")}@studionoord.nl`
    : `${parts[0]}@studionoord.nl`;
};

const initialsFor = (name: string) => {
  const parts = name.split(" ");
  const last = parts.slice(1).find((p) => /^\p{Lu}/u.test(p)) ?? parts[parts.length - 1];
  return `${parts[0][0]}${last[0]}`.toUpperCase();
};

const members: OrgUser[] = rows.map(([name, team, role, status, date], i) => ({
  id: `u_${i + 1}`,
  name,
  initials: initialsFor(name),
  email: emailFor(name, status),
  team,
  role,
  status,
  lastActiveAt: date,
  isMe: name === "Sanne Visser" || undefined,
}));

// Uitgenodigd maar nog niet ingelogd: de naam kennen we pas na de eerste login.
const invited: OrgUser[] = [
  {
    id: "inv_1",
    name: null,
    initials: "TK",
    email: "thijs@studionoord.nl",
    team: "Design",
    role: "cursist",
    status: "uitgenodigd",
    invitedAt: "2026-10-09T09:30:00Z",
    invitedBy: "Lotte Meijer",
  },
  {
    id: "inv_2",
    name: null,
    initials: "MV",
    email: "maud@studionoord.nl",
    team: "Strategie",
    role: "cursist",
    status: "uitgenodigd",
    invitedAt: "2026-10-12T13:00:00Z",
    invitedBy: "Esra Demir",
  },
];

export const mockOrgUsers: OrgUser[] = [...members, ...invited];

export const mockDomains: DomainSettings = {
  autoJoin: true,
  defaultTeam: "Design",
  domains: [
    { domain: "studionoord.nl", verified: true, addedAt: "2026-03-02" },
    { domain: "noord.studio", verified: false, addedAt: "2026-10-09" },
  ],
};

export const mockSso: SsoConnection = {
  provider: "Microsoft Entra ID",
  connected: true,
  tenant: "studionoord.onmicrosoft.com",
  connectedAt: "2026-03-04",
  lastSyncAt: "2026-10-14T06:00:00Z",
  enforced: false,
};

// Abonnement (Stripe)

export const mockSubscription: Subscription = {
  planId: "team",
  planName: "Team",
  interval: "jaar",
  // € 29 per maand, met 20% korting bij jaarlijks betalen.
  pricePerSeat: 23.2,
  seats: 25,
  minSeats: 10,
  maxSeats: 250,
  startedAt: "2026-03-01",
  renewsAt: "2027-03-01",
  cancelAtPeriodEnd: false,
};

export const mockPaymentMethod: PaymentMethod = {
  type: "sepa",
  label: "SEPA-incasso",
  detail: "NL•• INGB •••• •••• 4300",
  holder: "Studio Noord B.V.",
  meta: "Mandaat afgegeven op 1 maart 2026",
};

export const mockBillingDetails: BillingDetails = {
  companyName: "Studio Noord B.V.",
  street: "Nieuwe Herengracht 18",
  postalCode: "1018 DP",
  city: "Amsterdam",
  country: "Nederland",
  vatNumber: "NL859123456B01",
  invoiceEmail: "finance@studionoord.nl",
  reference: "PO-2026-0117",
};

export const mockInvoices: Invoice[] = [
  {
    number: "AIA-2026-1042",
    date: "2026-10-01",
    description: "Extra onboardingsessie, team Strategie",
    amount: 750,
    status: "open",
    dueAt: "2026-10-31",
  },
  {
    number: "AIA-2026-0688",
    date: "2026-06-12",
    description: "5 extra licenties Team, naar rato t/m 28 feb 2027",
    amount: 999.19,
    status: "betaald",
  },
  {
    number: "AIA-2026-0415",
    date: "2026-04-15",
    description: "Extra onboardingsessie, team Development",
    amount: 750,
    status: "betaald",
  },
  {
    number: "AIA-2026-0231",
    date: "2026-03-01",
    description: "Team jaarlijks, 20 licenties",
    amount: 5568,
    status: "betaald",
  },
];

// Organisatie

export const mockOrgProfile: OrgProfile = {
  name: "Studio Noord",
  legalName: "Studio Noord B.V.",
  initials: "SN",
  brandColor: "#1d4ed8",
  website: "https://studionoord.nl",
  memberSince: "2026-03-01",
};

export const mockPrivacy: PrivacySettings = {
  region: "EU — Frankfurt",
  regionDetail: "Alle gegevens en back-ups staan in datacenters in Frankfurt (Duitsland) en verlaten de EU niet.",
  dpa: { status: "getekend", version: "2.1", signedAt: "2026-03-01", signedBy: "Esra Demir" },
  retention: "24",
};

export const mockAuditLog: AuditEntry[] = [
  {
    id: "a1",
    at: "2026-10-14T08:20:00Z",
    actor: "Sanne Visser",
    actorInitials: "SV",
    category: "gebruikers",
    action: "Rol gewijzigd naar Teammanager",
    target: "Kevin Janssen",
  },
  {
    id: "a2",
    at: "2026-10-12T13:00:00Z",
    actor: "Esra Demir",
    actorInitials: "ED",
    category: "gebruikers",
    action: "Uitnodiging verstuurd",
    target: "maud@studionoord.nl",
  },
  {
    id: "a3",
    at: "2026-10-09T14:02:00Z",
    actor: "Sanne Visser",
    actorInitials: "SV",
    category: "beveiliging",
    action: "Domein toegevoegd voor automatisch toetreden",
    target: "noord.studio",
  },
  {
    id: "a4",
    at: "2026-10-09T09:30:00Z",
    actor: "Lotte Meijer",
    actorInitials: "LM",
    category: "gebruikers",
    action: "Uitnodiging verstuurd",
    target: "thijs@studionoord.nl",
  },
  {
    id: "a5",
    at: "2026-10-01T07:00:00Z",
    actor: "AI Academy",
    actorInitials: "AI",
    category: "abonnement",
    action: "Factuur aangemaakt",
    target: "AIA-2026-1042",
  },
  {
    id: "a6",
    at: "2026-09-22T11:30:00Z",
    actor: "Esra Demir",
    actorInitials: "ED",
    category: "organisatie",
    action: "Bewaartermijn gewijzigd naar 24 maanden",
  },
  {
    id: "a7",
    at: "2026-08-31T16:00:00Z",
    actor: "Esra Demir",
    actorInitials: "ED",
    category: "gebruikers",
    action: "Gebruiker gedeactiveerd",
    target: "Bas Vermeulen",
  },
  {
    id: "a8",
    at: "2026-07-15T10:00:00Z",
    actor: "Sanne Visser",
    actorInitials: "SV",
    category: "gebruikers",
    action: "Gebruiker gedeactiveerd",
    target: "Anouk Smit",
  },
  {
    id: "a9",
    at: "2026-06-12T09:41:00Z",
    actor: "Esra Demir",
    actorInitials: "ED",
    category: "abonnement",
    action: "Licenties verhoogd van 20 naar 25",
  },
  {
    id: "a10",
    at: "2026-05-20T13:12:00Z",
    actor: "Sanne Visser",
    actorInitials: "SV",
    category: "organisatie",
    action: "Merkkleur voor certificaten aangepast",
  },
  {
    id: "a11",
    at: "2026-03-04T10:05:00Z",
    actor: "Esra Demir",
    actorInitials: "ED",
    category: "beveiliging",
    action: "Single sign-on gekoppeld",
    target: "Microsoft Entra ID",
  },
  {
    id: "a12",
    at: "2026-03-01T09:00:00Z",
    actor: "Esra Demir",
    actorInitials: "ED",
    category: "organisatie",
    action: "Verwerkersovereenkomst getekend",
    target: "Versie 2.1",
  },
];
