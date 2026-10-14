import {
  mockInvites,
  mockLevelTest,
  mockOnboardingOptions,
  mockOnboardingProfile,
  mockSsoDomains,
} from "@/lib/mock/auth";

// Types voor inloggen, uitnodigingen en onboarding.

export type SsoProvider = "microsoft" | "google";

/** Organisatie die via een eigen domein met SSO inlogt. */
export type SsoDomain = { domain: string; organisation: string; provider: SsoProvider };

export type InviteStatus = "open" | "expired" | "accepted";

export type Invite = {
  token: string;
  status: InviteStatus;
  email: string;
  organisation: { name: string; initials: string; memberCount: number; ssoProvider?: SsoProvider };
  inviter: { name: string; initials: string; title: string };
  role: "Cursist" | "Manager";
  team: string;
  /** Leerpaden die de organisatie heeft toegewezen. */
  paths: string[];
  /** Deadline voor het eerste leerpad (ISO). */
  deadline?: string;
  expiresAt: string;
};

/** Wat we al weten van een nieuwe gebruiker (uit de uitnodiging of het SSO-account). */
export type OnboardingProfile = {
  firstName: string;
  lastName: string;
  email: string;
  organisation: string;
  team: string;
  /** Leerpad dat de organisatie heeft toegewezen, met deadline (ISO). */
  assignedPath: { slug: string; title: string; deadline?: string };
};

export type OnboardingRole = {
  value: string;
  title: string;
  eyebrow: string;
  description: string;
  /** Specialisatie die na AI 101 past bij deze rol. */
  recommendedPath?: string;
};

export type OnboardingOptions = {
  roles: OnboardingRole[];
  levels: { value: string; title: string; description: string }[];
  goals: { value: string; label: string }[];
  /** Standaardkeuzes voor het weekdoel, in minuten. */
  weekGoals: number[];
  reminders: { value: string; label: string; description: string }[];
};

export type LevelTestQuestion = {
  id: string;
  /** Onderwerp van AI 101 dat je mag overslaan als je deze vraag goed hebt. */
  topicId: string;
  question: string;
  options: string[];
  answer: number;
};

// Uitnodigingen. Wordt later een opzoeking in MongoDB (token gehasht, met vervaldatum).
export async function getInvite(token: string) {
  return mockInvites.find((invite) => invite.token === token) ?? null;
}

export async function getInviteTokens() {
  return mockInvites.map((invite) => invite.token);
}

// Domeinen met SSO, voor de hint op het inlogscherm. Komt later uit de organisatie-instellingen.
export async function getSsoDomains() {
  return mockSsoDomains;
}

// Gegevens van de ingelogde nieuwe gebruiker. Wordt later de Auth.js-sessie + MongoDB.
export async function getOnboardingProfile() {
  return mockOnboardingProfile;
}

// Keuzes in de intake. Komt later uit Storyblok, zodat de tekst zonder deploy aan te passen is.
export async function getOnboardingOptions() {
  return mockOnboardingOptions;
}

// Niveautoets. Later controleert de server de antwoorden; nu gebeurt dat in de browser.
export async function getLevelTest() {
  return mockLevelTest;
}
