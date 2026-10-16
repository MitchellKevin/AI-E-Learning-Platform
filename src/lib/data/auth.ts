import { mockLevelTest, mockOnboardingOptions } from "@/lib/mock/auth";
import { getLearningPath } from "@/lib/content";
import { connectDb } from "@/server/db";
import { Assignment, Invite as InviteModel, Organization, Team, User, initialsOf } from "@/server/models";
import { getUserContext } from "@/server/session";

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

// Uitnodiging op token, met organisatie en uitnodiger.
export async function getInvite(token: string): Promise<Invite | null> {
  await connectDb();
  const invite = await InviteModel.findOne({ token, revokedAt: null }).lean();
  if (!invite) return null;

  const [org, team, inviter, memberCount] = await Promise.all([
    Organization.findById(invite.orgId).lean(),
    invite.teamId ? Team.findById(invite.teamId).lean() : null,
    invite.invitedBy ? User.findById(invite.invitedBy).lean() : null,
    User.countDocuments({ orgId: invite.orgId, status: "actief" }),
  ]);
  if (!org) return null;

  const paths = await Promise.all((invite.paths ?? []).map((slug) => getLearningPath(slug)));
  const status = invite.acceptedAt ? "accepted" : invite.expiresAt < new Date() ? "expired" : "open";

  return {
    token: invite.token,
    status,
    email: invite.email,
    organisation: {
      name: org.name,
      initials: org.initials,
      memberCount,
      ssoProvider: org.sso?.status === "verbonden" ? (org.sso.provider as SsoProvider) : undefined,
    },
    inviter: {
      name: inviter ? `${inviter.firstName} ${inviter.lastName}` : org.name,
      initials: inviter ? initialsOf(inviter.firstName, inviter.lastName) : org.initials,
      title: inviter?.jobTitle ?? "",
    },
    role: invite.role === "learner" ? "Cursist" : "Manager",
    team: team?.name ?? "",
    paths: paths.filter(Boolean).map((p) => p!.title),
    deadline: invite.deadline?.toISOString(),
    expiresAt: invite.expiresAt.toISOString(),
  };
}

// Domeinen met een verbonden SSO-koppeling, voor de hint op het inlogscherm.
export async function getSsoDomains(): Promise<SsoDomain[]> {
  await connectDb();
  const orgs = await Organization.find({ "sso.status": "verbonden" }).lean();
  return orgs.flatMap((org) =>
    org.domains.filter((d) => d.verified && d.domain && !d.removedAt).map((d) => ({ domain: d.domain!, organisation: org.name, provider: org.sso!.provider as SsoProvider })),
  );
}

// Wat we al weten van de ingelogde nieuwe gebruiker, plus het eerste toegewezen leerpad.
export async function getOnboardingProfile(): Promise<OnboardingProfile> {
  const { user, org, team } = await getUserContext();
  const assignment = await Assignment.findOne({
    orgId: user.orgId,
    $or: [{ userIds: user._id }, ...(user.teamId ? [{ teamIds: user.teamId }] : [])],
  })
    .sort({ deadline: 1 })
    .lean();
  const slug = assignment?.pathSlug ?? "ai-101";
  const path = await getLearningPath(slug);

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    organisation: org.name,
    team: team?.name ?? "",
    assignedPath: { slug, title: path?.title ?? "AI 101", deadline: assignment?.deadline?.toISOString() },
  };
}

// Keuzes in de intake. Komt later uit Storyblok, zodat de tekst zonder deploy aan te passen is.
export async function getOnboardingOptions() {
  return mockOnboardingOptions;
}

// Niveautoets. Later controleert de server de antwoorden; nu gebeurt dat in de browser.
export async function getLevelTest() {
  return mockLevelTest;
}
