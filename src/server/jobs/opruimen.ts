import { AuditLog, Certificate, DemoRequest, Invite, JobRun, Organization, PracticeAttempt, User } from "@/server/models";
import { addDays } from "@/server/services/dates";
import { monthsBefore } from "./clock";
import { purgeOrganization, purgeUser } from "./purge";

// Nachtelijke opruimronde: oude uitnodigingen, verwijderverzoeken, bewaartermijnen en opgezegde organisaties.

/** Bedenktijd na een verwijderverzoek van een gebruiker (gelijk aan de instellingenpagina). */
export const ACCOUNT_GRACE_DAYS = 30;
/** Bedenktijd na een verwijderverzoek van een organisatie (gelijk aan de gevarenzone in beheer). */
export const ORG_GRACE_DAYS = 14;
/** Verlopen of ingetrokken uitnodigingen bewaren we nog even voor de historie. */
export const INVITE_KEEP_DAYS = 30;
export const JOB_RUN_KEEP_DAYS = 90;
// Bewaartermijnen uit de privacyverklaring en het auditlog in beheer.
export const PROMPT_KEEP_DAYS = 90;
export const DEMO_REQUEST_KEEP_MONTHS = 12;
export const AUDIT_KEEP_MONTHS = 24;
export const CERTIFICATE_KEEP_YEARS = 10;

export async function opruimen(now = new Date()) {
  // Eerst hele organisaties, zodat we hun gebruikers niet nog los verwijderen en auditen.
  const closing = await Organization.find({ deletionRequestedAt: { $lt: addDays(now, -ORG_GRACE_DAYS) } }, { _id: 1 }).lean();
  let organisatieGebruikers = 0;
  for (const org of closing) organisatieGebruikers += await purgeOrganization(org._id);

  const requested = await User.find({ deletionRequestedAt: { $lt: addDays(now, -ACCOUNT_GRACE_DAYS) } }, { _id: 1 }).lean();
  let verzoeken = 0;
  for (const user of requested) if (await purgeUser(user._id, "Account verwijderd na verzoek")) verzoeken++;

  // Bewaartermijn na deactivatie; "tot einde contract" ruimen we niet automatisch op.
  const orgs = await Organization.find({ retention: { $ne: "contract" } }, { retention: 1 }).lean();
  let bewaartermijn = 0;
  for (const org of orgs) {
    const cutoff = monthsBefore(now, Number(org.retention ?? "24"));
    const expired = await User.find({ orgId: org._id, status: "gedeactiveerd", deactivatedAt: { $lt: cutoff } }, { _id: 1 }).lean();
    for (const user of expired) if (await purgeUser(user._id, "Gegevens verwijderd na bewaartermijn", { keepCertificates: true })) bewaartermijn++;
  }

  const inviteCutoff = addDays(now, -INVITE_KEEP_DAYS);
  const invites = await Invite.deleteMany({
    acceptedAt: null,
    $or: [{ expiresAt: { $lt: inviteCutoff } }, { revokedAt: { $lt: inviteCutoff } }],
  });
  const runs = await JobRun.deleteMany({ status: { $ne: "bezig" }, startedAt: { $lt: addDays(now, -JOB_RUN_KEEP_DAYS) } });

  // Prompts zelf na 90 dagen weg; de score blijft voor de voortgang.
  const prompts = await PracticeAttempt.updateMany(
    { createdAt: { $lt: addDays(now, -PROMPT_KEEP_DAYS) }, prompt: { $exists: true } },
    { $unset: { prompt: 1 } },
  );
  const demo = await DemoRequest.deleteMany({ createdAt: { $lt: monthsBefore(now, DEMO_REQUEST_KEEP_MONTHS) } });
  const audit = await AuditLog.deleteMany({ createdAt: { $lt: monthsBefore(now, AUDIT_KEEP_MONTHS) } });
  const certificates = await Certificate.deleteMany({ issuedAt: { $lt: monthsBefore(now, CERTIFICATE_KEEP_YEARS * 12) } });

  return {
    organisaties: closing.length,
    organisatieGebruikers,
    verzoeken,
    bewaartermijn,
    uitnodigingen: invites.deletedCount,
    taakruns: runs.deletedCount,
    prompts: prompts.modifiedCount,
    demoAanvragen: demo.deletedCount,
    auditregels: audit.deletedCount,
    certificaten: certificates.deletedCount,
  };
}
