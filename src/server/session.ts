import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { Organization, Team, User, type UserRole } from "@/server/models";

// Wie is er ingelogd? Per request één keer opgehaald (React cache).

// Rol en onboarding komen altijd uit de database, nooit uit de (mogelijk verouderde) claims in het token.
export const getSessionUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDb();
  // Een databasefout gooit door (foutpagina) en logt dus niemand uit; alleen 'niet gevonden' maakt de sessie ongeldig.
  const user = await User.findById(session.user.id).lean();
  if (!user || user.status !== "actief" || !user.orgId) return null;
  // Zonder organisatie (bijv. na het verwijderen ervan) is de sessie ook ongeldig.
  const org = await Organization.findById(user.orgId, { deletionRequestedAt: 1 }).lean();
  if (!org) return null;
  // Organisatie wordt verwijderd: iedereen verliest direct toegang, behalve beheerders (die het nog kunnen intrekken).
  if (org.deletionRequestedAt && user.role !== "admin") return null;

  // "Laatst actief" voor het teambeheer, hooguit één keer per uur bijwerken.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (!user.lastActiveAt || user.lastActiveAt < hourAgo) {
    await User.updateOne({ _id: user._id, $or: [{ lastActiveAt: null }, { lastActiveAt: { $lt: hourAgo } }] }, { lastActiveAt: new Date() });
  }
  return user;
});

/** Staat er een (mogelijk verouderd) sessiecookie in de browser? Auth.js knipt grote cookies op in .0, .1… */
async function hasSessionCookie() {
  return (await cookies()).getAll().some((c) => /^(__Secure-)?authjs\.session-token/.test(c.name));
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    // Wel een cookie maar geen geldige gebruiker (verwijderd, gedeactiveerd of database opnieuw gevuld):
    // eerst het cookie wissen. Anders stuurt de middleware je van /inloggen terug en ontstaat een redirect-lus.
    redirect((await hasSessionCookie()) ? "/uitloggen" : "/inloggen");
  }
  return user as typeof user & { orgId: NonNullable<typeof user.orgId> };
}

const rank: Record<UserRole, number> = { learner: 0, manager: 1, admin: 2 };

/** Ingelogd én onboarding afgerond; anders naar de intake. Voor alles binnen de app. */
export async function requireOnboardedUser() {
  const user = await requireUser();
  if (!user.onboarding?.completedAt) redirect("/welkom");
  return user;
}

export async function requireRole(minimum: Exclude<UserRole, "learner">, fallback = "/dashboard") {
  const user = await requireOnboardedUser();
  if (rank[user.role as UserRole] < rank[minimum]) redirect(fallback);
  return user;
}

/** Voor server actions: gooit in plaats van te redirecten. */
export async function assertRole(minimum: UserRole) {
  const user = await getSessionUser();
  if (!user?.orgId) throw new UserError("Niet ingelogd");
  if (rank[user.role as UserRole] < rank[minimum]) throw new UserError("Geen toegang");
  return user as typeof user & { orgId: NonNullable<typeof user.orgId> };
}

export const getUserContext = cache(async () => {
  const user = await requireUser();
  const [org, team] = await Promise.all([
    Organization.findById(user.orgId).lean(),
    user.teamId ? Team.findById(user.teamId).lean() : null,
  ]);
  // getSessionUser controleert al of de organisatie bestaat; dit vangt een verwijdering tussendoor op.
  if (!org) redirect("/uitloggen");
  return { user, org, team };
});
