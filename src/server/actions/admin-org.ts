"use server";

import { randomBytes } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  INVITE_VALID_DAYS,
  PUBLIC_EMAIL_DOMAINS,
  domainTxtRecord,
  initialsFromEmail,
  isValidDomain,
  type OrgRole,
  type OrgUser,
} from "@/lib/data/admin-org-shared";
import { type ActionResult, guarded } from "@/server/actions/result";
import { connectDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { sendMail } from "@/server/mailer";
import { Invite, Organization, Team, User, type UserRole } from "@/server/models";
import { assertRole } from "@/server/session";
import { audit } from "@/server/services/audit";
import { seatsInUse } from "@/server/services/membership";
import { HOUR, assertRateLimit, retryIn } from "@/server/services/rate-limit";

// Acties van beheerders: gebruikers, uitnodigingen, domeinen, SSO en organisatie-instellingen.

const objectId = z.string().regex(/^[a-f0-9]{24}$/);
const inviteId = z.string().regex(/^inv_[a-f0-9]{24}$/).transform((v) => v.slice(4));
const orgRole = z.enum(["cursist", "teammanager", "beheerder"]);
const roleOf: Record<OrgRole, UserRole> = { cursist: "learner", teammanager: "manager", beheerder: "admin" };
const roleLabel: Record<OrgRole, string> = { cursist: "Cursist", teammanager: "Teammanager", beheerder: "Beheerder" };

async function adminContext() {
  const admin = await assertRole("admin");
  await connectDb();
  const org = await Organization.findById(admin.orgId);
  if (!org) throw new UserError("Organisatie niet gevonden");
  return { admin, org };
}

const done = () => revalidatePath("/beheer", "layout");

// Gebruikers

export async function setUserRoleAction(userId: string, role: OrgRole) {
  return guarded(async () => {
    const { admin, org } = await adminContext();
    const id = objectId.parse(userId);
    const next = roleOf[orgRole.parse(role)];
    if (admin._id.equals(id)) throw new UserError("Je kunt je eigen rol niet wijzigen");

    const user = await User.findOne({ _id: id, orgId: org._id });
    if (!user) throw new UserError("Gebruiker niet gevonden");
    user.role = next;
    await user.save();
    await audit({ orgId: org._id, actor: admin, category: "gebruikers", action: `Rol gewijzigd naar ${roleLabel[role]}`, target: `${user.firstName} ${user.lastName}` });
    done();
  });
}

export async function setUserStatusAction(userId: string, status: "actief" | "gedeactiveerd") {
  return guarded(async () => {
    const { admin, org } = await adminContext();
    const id = objectId.parse(userId);
    if (admin._id.equals(id)) throw new UserError("Je kunt jezelf niet deactiveren");
    const user = await User.findOne({ _id: id, orgId: org._id });
    if (!user) throw new UserError("Gebruiker niet gevonden");

    if (status === "actief" && user.status !== "actief" && (await seatsInUse(org._id)) >= (org.seats ?? 0)) {
      throw new UserError("Geen licentie vrij");
    }
    user.status = status;
    user.deactivatedAt = status === "gedeactiveerd" ? new Date() : undefined;
    await user.save();
    await audit({
      orgId: org._id,
      actor: admin,
      category: "gebruikers",
      action: status === "actief" ? "Gebruiker geheractiveerd" : "Gebruiker gedeactiveerd",
      target: `${user.firstName} ${user.lastName}`,
    });
    done();
  });
}

// Uitnodigingen

const INVITES_PER_HOUR = 100;
const inviteInput = z.array(
  z.object({ email: z.email(), role: orgRole, team: z.string().max(80), message: z.string().max(1000).default("") }),
).min(1).max(200);

export async function createInvitesAction(input: z.input<typeof inviteInput>): Promise<ActionResult<OrgUser[]>> {
  return guarded(async () => {
    const invites = inviteInput.parse(input);
    const { admin, org } = await adminContext();

    const emails = invites.map((i) => i.email.toLowerCase());
    const [existingUsers, existingInvites, teams, used] = await Promise.all([
      User.find({ email: { $in: emails } }, { email: 1 }).lean(),
      Invite.find({ orgId: org._id, email: { $in: emails }, acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } }, { email: 1 }).lean(),
      Team.find({ orgId: org._id }).lean(),
      seatsInUse(org._id),
    ]);
    const taken = new Set([...existingUsers, ...existingInvites].map((x) => x.email));
    const fresh = invites.filter((i) => !taken.has(i.email.toLowerCase()));
    if (used + fresh.length > (org.seats ?? 0)) throw new UserError("Niet genoeg licenties vrij");
    // We tellen verstuurde uitnodigingen, niet aanroepen.
    if (fresh.length) {
      await assertRateLimit({ key: `uitnodigingen:user:${admin._id}`, limit: INVITES_PER_HOUR, windowMs: HOUR, cost: fresh.length }, ({ remaining, retryAfterSeconds }) =>
        remaining > 0
          ? `Je kunt dit uur nog ${remaining === 1 ? "1 uitnodiging" : `${remaining} uitnodigingen`} versturen. Verstuur er minder tegelijk of probeer het ${retryIn(retryAfterSeconds)} opnieuw.`
          : `Je hebt het maximum van ${INVITES_PER_HOUR} uitnodigingen per uur bereikt. Probeer het ${retryIn(retryAfterSeconds)} opnieuw.`,
      );
    }

    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    const created: OrgUser[] = [];
    for (const invite of fresh) {
      const team = teams.find((t) => t.name === invite.team);
      const doc = await Invite.create({
        token: randomBytes(24).toString("base64url"),
        orgId: org._id,
        teamId: team?._id,
        email: invite.email,
        role: roleOf[invite.role],
        invitedBy: admin._id,
        message: invite.message || undefined,
        paths: ["ai-101"],
        expiresAt: new Date(Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000),
        lastSentAt: new Date(),
      });
      await sendMail({
        to: invite.email,
        subject: `${admin.firstName} nodigt je uit voor ${org.name} op AI Academy`,
        text: `${invite.message ? `${invite.message}\n\n` : ""}Accepteer je uitnodiging via de link hieronder. De link is ${INVITE_VALID_DAYS} dagen geldig.`,
        url: `${base}/uitnodiging/${doc.token}`,
      });
      created.push({
        id: `inv_${doc._id}`,
        name: null,
        initials: initialsFromEmail(invite.email),
        email: invite.email,
        team: team?.name ?? "",
        role: invite.role,
        status: "uitgenodigd",
        invitedAt: doc.createdAt.toISOString(),
        invitedBy: `${admin.firstName} ${admin.lastName}`,
      });
    }
    if (created.length) {
      await audit({
        orgId: org._id,
        actor: admin,
        category: "gebruikers",
        action: created.length === 1 ? "Uitnodiging verstuurd" : `${created.length} uitnodigingen verstuurd`,
        target: created.map((c) => c.email).join(", "),
      });
    }
    done();
    return created;
  });
}

export async function revokeInviteAction(id: string, restore = false) {
  return guarded(async () => {
    const { admin, org } = await adminContext();
    const invite = await Invite.findOneAndUpdate(
      { _id: inviteId.parse(id), orgId: org._id, acceptedAt: null },
      restore ? { $unset: { revokedAt: 1 } } : { revokedAt: new Date() },
    ).lean();
    if (!invite) throw new UserError("Uitnodiging niet gevonden");
    await audit({
      orgId: org._id,
      actor: admin,
      category: "gebruikers",
      action: restore ? "Intrekken van uitnodiging ongedaan gemaakt" : "Uitnodiging ingetrokken",
      target: invite.email,
    });
    done();
  });
}

// Domeinen en automatisch toetreden

export async function updateAutoJoinAction(settings: { autoJoin?: boolean; defaultTeam?: string }) {
  return guarded(async () => {
    const data = z.object({ autoJoin: z.boolean().optional(), defaultTeam: z.string().max(80).optional() }).parse(settings);
    const { admin, org } = await adminContext();
    if (data.autoJoin !== undefined) org.autoJoin = data.autoJoin;
    if (data.defaultTeam !== undefined) {
      const team = await Team.findOne({ orgId: org._id, name: data.defaultTeam }).lean();
      if (!team) throw new UserError("Onbekend team");
      org.autoJoinTeamId = team._id;
    }
    await org.save();
    await audit({
      orgId: org._id,
      actor: admin,
      category: "beveiliging",
      action:
        data.autoJoin !== undefined
          ? data.autoJoin
            ? "Automatisch toetreden aangezet"
            : "Automatisch toetreden uitgezet"
          : `Standaardteam gewijzigd naar ${data.defaultTeam}`,
    });
    done();
  });
}

const domainInput = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isValidDomain, "Ongeldig domein")
  .refine((d) => !PUBLIC_EMAIL_DOMAINS.includes(d), "Publieke maildomeinen kunnen niet");

// Toevoegen, of een zacht verwijderd domein terugzetten ("Ongedaan maken"). De verificatie blijft dan behouden,
// maar komt altijd uit de database: de browser kan een domein niet als geverifieerd opgeven.
export async function addDomainAction(value: string) {
  return guarded(async () => {
    const domain = domainInput.parse(value);
    const { admin, org } = await adminContext();
    // Een domein hoort bij één organisatie.
    if (await Organization.exists({ _id: { $ne: org._id }, domains: { $elemMatch: { domain, removedAt: null } } })) {
      throw new UserError("Dit domein is al gekoppeld");
    }
    const existing = org.domains.find((d) => d.domain === domain);
    if (existing) existing.removedAt = undefined;
    else org.domains.push({ domain, verified: false, addedAt: new Date() });
    await org.save();
    await audit({ orgId: org._id, actor: admin, category: "beveiliging", action: "Domein toegevoegd voor automatisch toetreden", target: domain });
    done();
  });
}

export async function removeDomainAction(value: string) {
  return guarded(async () => {
    const domain = domainInput.parse(value);
    const { admin, org } = await adminContext();
    const entry = org.domains.find((d) => d.domain === domain);
    if (entry) entry.removedAt = new Date();
    await org.save();
    await audit({ orgId: org._id, actor: admin, category: "beveiliging", action: "Domein verwijderd", target: domain });
    done();
  });
}

/** Controleert het TXT-record in de DNS. Geeft false als het record (nog) niet gevonden is. */
export async function verifyDomainAction(value: string) {
  return guarded(async () => {
    const domain = domainInput.parse(value);
    const { admin, org } = await adminContext();
    const records = await resolveTxt(domain).catch(() => [] as string[][]);
    const found = records.some((parts) => parts.join("") === domainTxtRecord(domain));
    if (!found) return false;

    const entry = org.domains.find((d) => d.domain === domain && !d.removedAt);
    if (!entry) return false;
    entry.verified = true;
    await org.save();
    await audit({ orgId: org._id, actor: admin, category: "beveiliging", action: "Domein geverifieerd", target: domain });
    done();
    return true;
  });
}

// Single sign-on. De clientgeheimen zelf horen in een kluis (later); hier alleen de status.

export async function connectSsoAction(provider: string, tenant: string) {
  return guarded(async () => {
    const data = z.object({ provider: z.string().max(60), tenant: z.string().trim().min(3).max(200) }).parse({ provider, tenant });
    const { admin, org } = await adminContext();
    org.sso = {
      provider: /google/i.test(data.provider) ? "google" : "microsoft",
      status: "verbonden",
      tenant: data.tenant,
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      enforced: false,
    };
    await org.save();
    await audit({ orgId: org._id, actor: admin, category: "beveiliging", action: `Single sign-on gekoppeld (${data.provider})`, target: data.tenant });
    done();
  });
}

export async function disconnectSsoAction() {
  return guarded(async () => {
    const { admin, org } = await adminContext();
    if (org.sso) {
      org.sso.status = "niet-ingesteld";
      org.sso.enforced = false;
    }
    await org.save();
    await audit({ orgId: org._id, actor: admin, category: "beveiliging", action: "Single sign-on ontkoppeld" });
    done();
  });
}

export async function setSsoEnforcedAction(enforced: boolean) {
  return guarded(async () => {
    const { admin, org } = await adminContext();
    if (org.sso?.status !== "verbonden") throw new UserError("Koppel eerst single sign-on");
    org.sso.enforced = z.boolean().parse(enforced);
    await org.save();
    await audit({
      orgId: org._id,
      actor: admin,
      category: "beveiliging",
      action: enforced ? "Inloggen alleen via SSO" : "Inloggen per e-mail weer toegestaan",
    });
    done();
  });
}

// Organisatie

const profileInput = z.object({
  name: z.string().trim().min(1).max(120),
  legalName: z.string().trim().max(160),
  website: z.string().trim().max(200).refine((v) => !v || /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v), "Ongeldige website"),
  brandColor: z.string().regex(/^#[0-9a-f]{6}$/i),
});

export async function saveOrgProfileAction(input: z.input<typeof profileInput>) {
  return guarded(async () => {
    const data = profileInput.parse(input);
    const { admin, org } = await adminContext();
    Object.assign(org, data);
    await org.save();
    await audit({ orgId: org._id, actor: admin, category: "organisatie", action: "Organisatieprofiel bijgewerkt" });
    done();
  });
}

export async function setRetentionAction(retention: "12" | "24" | "36" | "contract") {
  return guarded(async () => {
    const value = z.enum(["12", "24", "36", "contract"]).parse(retention);
    const { admin, org } = await adminContext();
    org.retention = value;
    await org.save();
    await audit({
      orgId: org._id,
      actor: admin,
      category: "organisatie",
      action: "Bewaartermijn gewijzigd",
      target: value === "contract" ? "Tot einde contract" : `${value} maanden`,
    });
    done();
  });
}

export async function requestOrgDeletionAction(cancel = false) {
  return guarded(async () => {
    const { admin, org } = await adminContext();
    org.deletionRequestedAt = cancel ? undefined : new Date();
    await org.save();
    await audit({
      orgId: org._id,
      actor: admin,
      category: "organisatie",
      action: cancel ? "Verwijderverzoek ingetrokken" : "Verwijdering van de organisatie aangevraagd",
    });
    done();
  });
}
