import { cache } from "react";
import { mockBillingDetails, mockInvoices, mockPaymentMethod, mockSubscription } from "@/lib/mock/admin-org";
import { connectDb } from "@/server/db";
import { AuditLog, Invite, Organization, Team, User, initialsOf, type UserRole } from "@/server/models";
import { requireRole } from "@/server/session";
import {
  initialsFromEmail,
  type AuditCategory,
  type AuditEntry,
  type BillingDetails,
  type DomainSettings,
  type Invoice,
  type OrgProfile,
  type OrgRole,
  type OrgUser,
  type PaymentMethod,
  type PrivacySettings,
  type RetentionPeriod,
  type SsoConnection,
  type Subscription,
} from "./admin-org-shared";

export * from "./admin-org-shared";

// Organisatiebeheer (alleen beheerders): gebruikers en organisatie uit MongoDB.
// Abonnement, betaalmethode en facturen blijven mock tot Stripe gekoppeld is.

export const orgRoleOf: Record<UserRole, OrgRole> = { learner: "cursist", manager: "teammanager", admin: "beheerder" };
export const userRoleOf: Record<OrgRole, UserRole> = { cursist: "learner", teammanager: "manager", beheerder: "admin" };

const context = cache(async () => {
  const admin = await requireRole("admin", "/beheer");
  await connectDb();
  const org = await Organization.findById(admin.orgId).lean();
  if (!org) throw new Error("Organisatie niet gevonden");
  return { admin, org };
});

export async function getOrgUsers(): Promise<OrgUser[]> {
  const { admin, org } = await context();
  const [users, invites, teams] = await Promise.all([
    User.find({ orgId: org._id }).sort({ firstName: 1 }).lean(),
    Invite.find({ orgId: org._id, acceptedAt: null, revokedAt: null }).sort({ createdAt: -1 }).lean(),
    Team.find({ orgId: org._id }).lean(),
  ]);
  const teamName = new Map(teams.map((t) => [String(t._id), t.name]));
  const inviters = new Map(
    (await User.find({ _id: { $in: invites.map((i) => i.invitedBy).filter(Boolean) } }, { firstName: 1, lastName: 1 }).lean()).map(
      (u) => [String(u._id), `${u.firstName} ${u.lastName}`],
    ),
  );

  return [
    ...users.map<OrgUser>((u) => ({
      id: String(u._id),
      name: `${u.firstName} ${u.lastName}`.trim() || null,
      initials: initialsOf(u.firstName, u.lastName, u.email),
      email: u.email,
      team: teamName.get(String(u.teamId)) ?? "",
      role: orgRoleOf[u.role as UserRole],
      status: u.status === "gedeactiveerd" ? "gedeactiveerd" : "actief",
      lastActiveAt: (u.status === "gedeactiveerd" ? u.updatedAt : u.lastActiveAt)?.toISOString(),
      isMe: u._id.equals(admin._id) || undefined,
    })),
    // Uitgenodigd maar nog niet ingelogd: de naam kennen we pas na de eerste login.
    ...invites
      .filter((i) => i.expiresAt > new Date())
      .map<OrgUser>((i) => ({
        id: `inv_${i._id}`,
        name: null,
        initials: initialsFromEmail(i.email),
        email: i.email,
        team: teamName.get(String(i.teamId)) ?? "",
        role: orgRoleOf[i.role as UserRole],
        status: "uitgenodigd",
        invitedAt: (i.lastSentAt ?? i.createdAt).toISOString(),
        invitedBy: i.invitedBy ? inviters.get(String(i.invitedBy)) : undefined,
      })),
  ];
}

export async function getTeams(): Promise<string[]> {
  const { org } = await context();
  return (await Team.find({ orgId: org._id }).sort({ name: 1 }).lean()).map((t) => t.name);
}

export async function getSeatTotal(): Promise<number> {
  return (await context()).org.seats ?? 0;
}

export async function getDomainSettings(): Promise<DomainSettings> {
  const { org } = await context();
  const team = org.autoJoinTeamId ? await Team.findById(org.autoJoinTeamId).lean() : null;
  return {
    autoJoin: Boolean(org.autoJoin),
    defaultTeam: team?.name ?? "",
    domains: org.domains.filter((d) => !d.removedAt).map((d) => ({
      domain: d.domain ?? "",
      verified: Boolean(d.verified),
      addedAt: (d.addedAt ?? org.createdAt).toISOString().slice(0, 10),
    })),
  };
}

const providerName = { microsoft: "Microsoft Entra ID", google: "Google Workspace" } as const;

export async function getSso(): Promise<SsoConnection> {
  const { org } = await context();
  const sso = org.sso;
  return {
    provider: sso?.provider ? providerName[sso.provider] : "Microsoft Entra ID",
    connected: sso?.status === "verbonden",
    tenant: sso?.tenant ?? undefined,
    connectedAt: sso?.connectedAt?.toISOString().slice(0, 10),
    lastSyncAt: sso?.lastSyncAt?.toISOString(),
    enforced: Boolean(sso?.enforced),
  };
}

// Abonnement (Stripe, nog mock). Het aantal licenties komt wel uit de organisatie.
export async function getSubscription(): Promise<Subscription> {
  const { org } = await context();
  return { ...mockSubscription, seats: org.seats ?? mockSubscription.seats };
}

export async function getPaymentMethod(): Promise<PaymentMethod> {
  await context();
  return mockPaymentMethod;
}

export async function getBillingDetails(): Promise<BillingDetails> {
  await context();
  return mockBillingDetails;
}

export async function getInvoices(): Promise<Invoice[]> {
  await context();
  return mockInvoices;
}

export async function getOrgProfile(): Promise<OrgProfile> {
  const { org } = await context();
  return {
    name: org.name,
    legalName: org.legalName ?? "",
    initials: org.initials,
    brandColor: org.brandColor ?? "#1d4ed8",
    website: org.website ?? "",
    memberSince: org.createdAt.toISOString().slice(0, 10),
  };
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const { org } = await context();
  return {
    region: org.dataRegion ?? "EU — Frankfurt",
    regionDetail: "Alle gegevens en back-ups staan in datacenters in Frankfurt (Duitsland) en verlaten de EU niet.",
    dpa: {
      status: org.dpa?.signedAt ? "getekend" : "niet-getekend",
      version: org.dpa?.version ?? "2.1",
      signedAt: org.dpa?.signedAt?.toISOString().slice(0, 10),
      signedBy: org.dpa?.signedBy ?? undefined,
    },
    retention: (org.retention ?? "24") as RetentionPeriod,
  };
}

const categories: AuditCategory[] = ["gebruikers", "abonnement", "organisatie", "beveiliging"];

export async function getAuditLog(): Promise<AuditEntry[]> {
  const { org } = await context();
  const entries = await AuditLog.find({ orgId: org._id }).sort({ createdAt: -1 }).limit(100).lean();
  return entries.map((e) => {
    const [first = "", ...rest] = (e.actorName ?? "").split(" ");
    const category = (e.meta as { category?: string } | undefined)?.category as AuditCategory | undefined;
    return {
      id: String(e._id),
      at: e.createdAt.toISOString(),
      actor: e.actorName ?? "Systeem",
      actorInitials: initialsOf(first, rest.join(" ")),
      category: category && categories.includes(category) ? category : "organisatie",
      action: e.action,
      target: e.target ?? undefined,
    };
  });
}
