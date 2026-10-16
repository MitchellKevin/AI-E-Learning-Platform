import mongoose, { type Types } from "mongoose";
import {
  Account,
  ActivityDay,
  Assignment,
  AuditLog,
  Certificate,
  Enrollment,
  ExamAttempt,
  Invite,
  LeaderboardSnapshot,
  Notification,
  Organization,
  PointEvent,
  PracticeAttempt,
  TaskProgress,
  User,
  UserBadge,
  VerificationToken,
} from "@/server/models";

// Definitief verwijderen. Eerst alle gekoppelde gegevens, de gebruiker of organisatie zelf als laatste:
// breekt een run halverwege af, dan vindt de volgende run hem terug en maakt het af.

/**
 * Verwijdert een gebruiker met al zijn gegevens en zet dat (als "Systeem") in het auditlog van de organisatie.
 * Geeft de oude naam terug, of null als de gebruiker niet meer bestaat.
 */
export async function purgeUser(
  userId: Types.ObjectId,
  action = "Account verwijderd na verzoek",
  // Na de bewaartermijn blijven certificaten controleerbaar (privacyverklaring: 10 jaar); bij een verwijderverzoek niet.
  { keepCertificates = false }: { keepCertificates?: boolean } = {},
) {
  const user = await User.findById(userId, { email: 1, firstName: 1, lastName: 1, orgId: 1 }).lean();
  if (!user) return null;
  const own = { userId: user._id };

  await Promise.all([
    TaskProgress.deleteMany(own),
    ActivityDay.deleteMany(own),
    PointEvent.deleteMany(own),
    UserBadge.deleteMany(own),
    Notification.deleteMany(own),
    PracticeAttempt.deleteMany(own),
    ExamAttempt.deleteMany(own),
    Enrollment.deleteMany(own),
    ...(keepCertificates ? [] : [Certificate.deleteMany(own)]),
    Account.deleteMany(own),
    VerificationToken.deleteMany({ identifier: user.email }),
    Assignment.updateMany({ userIds: user._id }, { $pull: { userIds: user._id } }),
    LeaderboardSnapshot.updateMany({ "entries.userId": user._id }, { $pull: { entries: { userId: user._id } } }),
    ...(user.orgId ? [Invite.deleteMany({ orgId: user.orgId, email: user.email })] : []),
  ]);
  await User.deleteOne({ _id: user._id });

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Onbekende gebruiker";
  if (user.orgId) {
    await AuditLog.create({ orgId: user.orgId, actorName: "Systeem", action, target: name, meta: { category: "gebruikers" } });
  }
  return name;
}

/** Verwijdert een organisatie met alles wat erbij hoort, in elke collectie met een orgId. Geeft het aantal gebruikers terug. */
export async function purgeOrganization(orgId: Types.ObjectId) {
  // Zonder id zou { orgId: undefined } alles matchen.
  if (!orgId) throw new Error("purgeOrganization: orgId ontbreekt");
  const users = await User.find({ orgId }, { _id: 1, email: 1 }).lean();
  const userIds = users.map((u) => u._id);

  // Ook collecties die er later bij komen: elk model met een orgId-veld (de gebruikers zelf als laatste).
  const scoped = Object.values(mongoose.models).filter((m) => m.schema.path("orgId") && m.modelName !== User.modelName);
  await Promise.all([
    ...scoped.map((m) => m.deleteMany({ orgId })),
    UserBadge.deleteMany({ userId: { $in: userIds } }),
    Account.deleteMany({ userId: { $in: userIds } }),
    VerificationToken.deleteMany({ identifier: { $in: users.map((u) => u.email) } }),
  ]);
  await User.deleteMany({ orgId });
  await Organization.deleteOne({ _id: orgId });
  return users.length;
}
