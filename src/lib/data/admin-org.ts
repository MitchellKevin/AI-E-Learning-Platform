import {
  mockAuditLog,
  mockBillingDetails,
  mockDomains,
  mockInvoices,
  mockOrgProfile,
  mockOrgUsers,
  mockPaymentMethod,
  mockPrivacy,
  mockSso,
  mockSubscription,
  mockTeams,
} from "@/lib/mock/admin-org";

// Organisatiebeheer: gebruikers, licenties, abonnement en organisatie-instellingen.
// Nu op mock-data; later uit MongoDB (gebruikers, organisatie) en Stripe (abonnement, facturen).

// Gebruikers

export type OrgRole = "cursist" | "teammanager" | "beheerder";
export type UserStatus = "actief" | "uitgenodigd" | "gedeactiveerd";

export const ROLE_LABELS: Record<OrgRole, string> = {
  cursist: "Cursist",
  teammanager: "Teammanager",
  beheerder: "Beheerder",
};

export const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  cursist: "Volgt leerpaden en ziet alleen de eigen voortgang.",
  teammanager: "Wijst leerpaden toe en ziet de voortgang van het eigen team.",
  beheerder: "Beheert gebruikers, het abonnement en de organisatie.",
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  actief: "Actief",
  uitgenodigd: "Uitgenodigd",
  gedeactiveerd: "Gedeactiveerd",
};

export type OrgUser = {
  id: string;
  /** Leeg zolang een uitgenodigde collega nog niet heeft ingelogd. */
  name: string | null;
  initials: string;
  email: string;
  team: string;
  role: OrgRole;
  status: UserStatus;
  /** Laatste keer ingelogd (actief) of gedeactiveerd op. */
  lastActiveAt?: string;
  invitedAt?: string;
  invitedBy?: string;
  /** De ingelogde beheerder zelf. */
  isMe?: boolean;
};

export type SeatUsage = { total: number; active: number; invited: number };

/** Uitnodigingen verlopen na 14 dagen. */
export const INVITE_VALID_DAYS = 14;

export type AutoJoinDomain = { domain: string; verified: boolean; addedAt: string };

export type DomainSettings = {
  autoJoin: boolean;
  /** Team waarin collega's via een domein binnenkomen; ze starten als cursist. */
  defaultTeam: string;
  domains: AutoJoinDomain[];
};

export type SsoConnection = {
  provider: string;
  connected: boolean;
  tenant?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  /** Inloggen met e-mail uit, alleen via SSO. */
  enforced: boolean;
};

export async function getOrgUsers(): Promise<OrgUser[]> {
  return mockOrgUsers;
}

export async function getTeams(): Promise<string[]> {
  return mockTeams;
}

export async function getSeatTotal(): Promise<number> {
  return mockSubscription.seats;
}

export async function getDomainSettings(): Promise<DomainSettings> {
  return mockDomains;
}

export async function getSso(): Promise<SsoConnection> {
  return mockSso;
}

/** Actieve en uitgenodigde gebruikers bezetten een licentie; gedeactiveerde niet. */
export function seatUsage(users: OrgUser[], total: number): SeatUsage {
  return {
    total,
    active: users.filter((u) => u.status === "actief").length,
    invited: users.filter((u) => u.status === "uitgenodigd").length,
  };
}

const EMAIL = /^[^\s@,;<>()]+@[^\s@,;<>()]+\.[a-z]{2,}$/i;
export const isValidEmail = (value: string) => EMAIL.test(value.trim());

const DOMAIN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*\.[a-z]{2,}$/i;
export const isValidDomain = (value: string) => DOMAIN.test(value.trim());

/** Publieke maildomeinen mogen niet automatisch toetreden. */
export const PUBLIC_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "live.nl",
  "icloud.com",
  "yahoo.com",
  "ziggo.nl",
  "kpnmail.nl",
];

export function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : local.slice(0, 2);
  return letters.toUpperCase() || "?";
}

// Abonnement

export type PlanId = "starter" | "team" | "enterprise";
export type BillingInterval = "maand" | "jaar";

export type Subscription = {
  planId: PlanId;
  planName: string;
  interval: BillingInterval;
  /** Prijs per gebruiker per maand, excl. btw, na jaarkorting. */
  pricePerSeat: number;
  seats: number;
  minSeats: number;
  maxSeats: number;
  startedAt: string;
  renewsAt: string;
  /** Opgezegd: loopt door tot `renewsAt` en verlengt daarna niet. */
  cancelAtPeriodEnd: boolean;
};

export type PaymentMethodType = "sepa" | "ideal" | "card";

export type PaymentMethod = {
  type: PaymentMethodType;
  /** Bijvoorbeeld "SEPA-incasso" of "Visa". */
  label: string;
  /** Gemaskeerd: IBAN of kaartnummer. */
  detail: string;
  holder: string;
  /** Mandaat- of vervaldatum. */
  meta: string;
};

export type BillingDetails = {
  companyName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  vatNumber: string;
  invoiceEmail: string;
  /** Inkoopordernummer op elke factuur. */
  reference: string;
};

export type InvoiceStatus = "betaald" | "open";

export type Invoice = {
  number: string;
  date: string;
  description: string;
  /** Excl. btw. */
  amount: number;
  status: InvoiceStatus;
  dueAt?: string;
};

export async function getSubscription(): Promise<Subscription> {
  return mockSubscription;
}

export async function getPaymentMethod(): Promise<PaymentMethod> {
  return mockPaymentMethod;
}

export async function getBillingDetails(): Promise<BillingDetails> {
  return mockBillingDetails;
}

export async function getInvoices(): Promise<Invoice[]> {
  return mockInvoices;
}

export const VAT_RATE = 0.21;

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

/** Altijd met centen: facturen en prijzen moeten tot op de cent kloppen. */
export const formatEuro = (amount: number) => euro.format(Math.round(amount * 100) / 100);

const DAY = 24 * 60 * 60 * 1000;

export const daysBetween = (fromIso: string, toIso: string) =>
  Math.max(0, Math.round((Date.parse(toIso.slice(0, 10)) - Date.parse(fromIso.slice(0, 10))) / DAY));

/**
 * Kosten van extra licenties voor de rest van de lopende periode (excl. btw).
 * Minder licenties gaan pas in bij de verlenging en leveren dus niets op.
 */
export function prorate(sub: Subscription, newSeats: number, todayIso: string) {
  const extra = newSeats - sub.seats;
  const periodDays = daysBetween(sub.startedAt, sub.renewsAt) || 365;
  const remainingDays = Math.min(periodDays, daysBetween(todayIso, sub.renewsAt));
  const yearly = sub.interval === "jaar" ? 12 : 1;
  const perSeatPeriod = sub.pricePerSeat * yearly;
  const amount = extra > 0 ? (extra * perSeatPeriod * remainingDays) / periodDays : 0;
  return { extra, remainingDays, amount: Math.round(amount * 100) / 100 };
}

/** NL-btw-nummer: NL + 9 cijfers + B + 2 cijfers, bv. NL859123456B01. */
export function normalizeVat(value: string) {
  return value.replace(/[\s.-]/g, "").toUpperCase();
}

export const isValidNlVat = (value: string) => /^NL\d{9}B\d{2}$/.test(normalizeVat(value));

export const isValidPostalCode = (value: string) => /^\d{4}\s?[A-Z]{2}$/i.test(value.trim());

// Organisatie

export type OrgProfile = {
  name: string;
  legalName: string;
  initials: string;
  /** Accentkleur op certificaten. */
  brandColor: string;
  website: string;
  memberSince: string;
};

export type RetentionPeriod = "12" | "24" | "36" | "contract";

export const RETENTION_OPTIONS: { value: RetentionPeriod; label: string }[] = [
  { value: "12", label: "12 maanden na deactivatie" },
  { value: "24", label: "24 maanden na deactivatie" },
  { value: "36", label: "36 maanden na deactivatie" },
  { value: "contract", label: "Tot het einde van het contract" },
];

export type PrivacySettings = {
  region: string;
  regionDetail: string;
  dpa: { status: "getekend" | "niet-getekend"; version: string; signedAt?: string; signedBy?: string };
  retention: RetentionPeriod;
};

export type AuditCategory = "gebruikers" | "abonnement" | "organisatie" | "beveiliging";

export const AUDIT_LABELS: Record<AuditCategory, string> = {
  gebruikers: "Gebruikers",
  abonnement: "Abonnement",
  organisatie: "Organisatie",
  beveiliging: "Beveiliging",
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  actorInitials: string;
  category: AuditCategory;
  action: string;
  target?: string;
};

export async function getOrgProfile(): Promise<OrgProfile> {
  return mockOrgProfile;
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
  return mockPrivacy;
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  return mockAuditLog;
}

// Datums

// Vaste tijdzone, zodat server en browser dezelfde datum tonen.
const shortDate = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Amsterdam",
});
const dateTime = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

/** "12 okt. 2026" */
export const formatShortDate = (iso: string) => shortDate.format(new Date(iso));

/** "12 okt. 14:05" */
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

export const addDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY).toISOString();
