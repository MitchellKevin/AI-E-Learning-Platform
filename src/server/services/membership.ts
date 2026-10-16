import { Invite, Organization, User, type UserRole } from "@/server/models";
import type { Types } from "mongoose";

// Bij welke organisatie hoort een (nieuw) e-mailadres? Via een open uitnodiging of een domein met automatisch toetreden.

export type Membership = {
  orgId: Types.ObjectId;
  teamId?: Types.ObjectId;
  role: UserRole;
  inviteId?: Types.ObjectId;
};

export async function resolveMembership(email: string): Promise<Membership | null> {
  const address = email.trim().toLowerCase();

  const invite = await Invite.findOne({
    email: address,
    acceptedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();
  if (invite) {
    return { orgId: invite.orgId, teamId: invite.teamId ?? undefined, role: invite.role as UserRole, inviteId: invite._id };
  }

  const domain = address.split("@")[1];
  if (!domain) return null;
  const org = await Organization.findOne({
    autoJoin: true,
    deletionRequestedAt: null,
    domains: { $elemMatch: { domain, verified: true, removedAt: null } },
  }).lean();
  // Automatisch toetreden kost ook een licentie; is alles bezet, dan is een uitnodiging nodig.
  if (org && (await seatsInUse(org._id)) < (org.seats ?? 0)) {
    return { orgId: org._id, teamId: org.autoJoinTeamId ?? undefined, role: "learner" };
  }

  return null;
}

/** Moet dit adres via SSO inloggen? Alleen als de organisatie SSO verplicht en het domein van haar is. */
export async function ssoRequiredFor(email: string) {
  const address = email.trim().toLowerCase();
  const domain = address.split("@")[1];
  if (!domain) return false;
  const user = await User.findOne({ email: address }, { orgId: 1 }).lean();
  const filter = user?.orgId
    ? { _id: user.orgId }
    : { domains: { $elemMatch: { domain, verified: true, removedAt: null } } };
  const org = await Organization.findOne({ ...filter, "sso.status": "verbonden", "sso.enforced": true }).lean();
  return Boolean(org?.domains.some((d) => d.domain === domain && d.verified && !d.removedAt));
}

/** Mag dit e-mailadres inloggen? Bestaande actieve gebruiker of een geldige weg naar een organisatie. */
export async function canSignIn(email: string) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).lean();
  if (user) return user.status === "actief" && Boolean(user.orgId);
  return Boolean(await resolveMembership(email));
}

/** Seats bezet: actieve gebruikers plus openstaande uitnodigingen. */
export async function seatsInUse(orgId: Types.ObjectId) {
  const [users, invites] = await Promise.all([
    User.countDocuments({ orgId, status: "actief" }),
    Invite.countDocuments({ orgId, acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } }),
  ]);
  return users + invites;
}

/**
 * Mag dit adres inloggen met deze SSO-aanbieder? Alleen als de organisatie (van de gebruiker of de uitnodiging/het
 * domein) SSO bij díe aanbieder heeft gekoppeld, het token uit haar eigen tenant komt (Entra: tid, Google: hd) en
 * het adres op een geverifieerd domein van de organisatie staat. Zonder deze controle kan iemand met een eigen
 * Microsoft-tenant elk e-mailadres claimen ("nOAuth").
 */
export async function ssoSignInAllowed(email: string, provider: "microsoft" | "google", tenantClaim: unknown) {
  const address = email.trim().toLowerCase();
  const domain = address.split("@")[1];
  if (!domain || typeof tenantClaim !== "string" || !tenantClaim) return false;

  const user = await User.findOne({ email: address }, { orgId: 1 }).lean();
  const orgId = user?.orgId ?? (await resolveMembership(address))?.orgId;
  if (!orgId) return false;
  const org = await Organization.findById(orgId, { sso: 1, domains: 1 }).lean();
  if (org?.sso?.status !== "verbonden" || org.sso.provider !== provider || !org.sso.tenant) return false;
  if (org.sso.tenant.trim().toLowerCase() !== tenantClaim.trim().toLowerCase()) return false;
  return org.domains.some((d) => d.domain === domain && d.verified && !d.removedAt);
}
