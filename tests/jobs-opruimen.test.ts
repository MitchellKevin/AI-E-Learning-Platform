import mongoose, { type Types } from "mongoose";
import { describe, expect, it } from "vitest";
import {
  Account,
  ActivityDay,
  Assignment,
  AuditLog,
  Certificate,
  DemoRequest,
  Enrollment,
  ExamAttempt,
  Invite,
  LeaderboardSnapshot,
  Notification,
  Organization,
  PointEvent,
  PracticeAttempt,
  TaskProgress,
  Team,
  User,
  UserBadge,
  VerificationToken,
} from "@/server/models";
import { addDays } from "@/server/services/dates";
import { opruimen } from "@/server/jobs/opruimen";
import { purgeUser } from "@/server/jobs/purge";
import { createOrgWithUser, setupTestDb } from "./helpers/db";

setupTestDb();

const now = new Date("2026-10-16T03:00:00Z");
const daysAgo = (n: number) => addDays(now, -n);
const monthsAgo = (n: number) => {
  const date = new Date(now);
  date.setUTCMonth(date.getUTCMonth() - n);
  return date;
};

type Person = { _id: Types.ObjectId; email: string; orgId?: Types.ObjectId | null };

// Van alles één, in elke collectie die bij een gebruiker hoort.
async function seedData(user: Person, tag: string) {
  const own = { userId: user._id, orgId: user.orgId ?? undefined };
  await Promise.all([
    TaskProgress.create({ ...own, pathSlug: "ai-101", chapterId: "ai-101/1-1", taskId: "intro" }),
    ActivityDay.create({ ...own, date: "2026-10-01" }),
    PointEvent.create({ ...own, amount: 10, reason: "start", refId: tag }),
    UserBadge.create({ userId: user._id, code: "01" }),
    Notification.create({ ...own, type: "team", title: "Hallo" }),
    PracticeAttempt.create({ ...own, exerciseSlug: "x" }),
    ExamAttempt.create({ ...own, pathSlug: "ai-101" }),
    Enrollment.create({ ...own, pathSlug: "ai-101" }),
    Certificate.create({ ...own, number: `C-${tag}`, pathSlug: "ai-101", holderName: tag, score: 90 }),
    Account.create({ userId: user._id, type: "oauth", provider: "google", providerAccountId: tag }),
    VerificationToken.create({ identifier: user.email, token: tag, expires: addDays(new Date(), 1) }),
    Invite.create({ token: `i-${tag}`, orgId: own.orgId, email: user.email, expiresAt: daysAgo(100), acceptedAt: daysAgo(100) }),
  ]);
}

async function countsFor(user: Person) {
  const own = { userId: user._id };
  return {
    taken: await TaskProgress.countDocuments(own),
    dagen: await ActivityDay.countDocuments(own),
    punten: await PointEvent.countDocuments(own),
    badges: await UserBadge.countDocuments(own),
    meldingen: await Notification.countDocuments(own),
    oefeningen: await PracticeAttempt.countDocuments(own),
    toetsen: await ExamAttempt.countDocuments(own),
    inschrijvingen: await Enrollment.countDocuments(own),
    certificaten: await Certificate.countDocuments(own),
    accounts: await Account.countDocuments(own),
    tokens: await VerificationToken.countDocuments({ identifier: user.email }),
    uitnodigingen: await Invite.countDocuments({ email: user.email }),
    toewijzingen: await Assignment.countDocuments({ userIds: user._id }),
    standen: await LeaderboardSnapshot.countDocuments({ "entries.userId": user._id }),
    gebruiker: await User.countDocuments({ _id: user._id }),
  };
}

const allOnes = (counts: Record<string, number>) => Object.fromEntries(Object.keys(counts).map((k) => [k, 1]));
const allZeros = (counts: Record<string, number>) => Object.fromEntries(Object.keys(counts).map((k) => [k, 0]));

describe("purgeUser", () => {
  it("verwijdert alle gegevens van de gebruiker en niets van anderen", async () => {
    const { org, user: anna } = await createOrgWithUser("Noord", "anna@noord.nl", { firstName: "Anna", lastName: "Jansen" });
    const bo = (await User.create({ email: "bo@noord.nl", firstName: "Bo", orgId: org._id })).toObject();
    await seedData(anna, "a");
    await seedData(bo, "b");
    await Assignment.create({ orgId: org._id, pathSlug: "ai-101", userIds: [anna._id, bo._id] });
    await LeaderboardSnapshot.create({ orgId: org._id, month: "2026-09", entries: [{ userId: anna._id, rank: 1, points: 10 }, { userId: bo._id, rank: 2, points: 5 }] });

    expect(await purgeUser(anna._id)).toBe("Anna Jansen");

    const gone = await countsFor(anna);
    expect(gone).toEqual(allZeros(gone));
    const kept = await countsFor(bo);
    expect(kept).toEqual(allOnes(kept));
    expect(await Assignment.countDocuments()).toBe(1);

    const [log] = await AuditLog.find({ orgId: org._id }).lean();
    expect(log).toMatchObject({ actorName: "Systeem", action: "Account verwijderd na verzoek", target: "Anna Jansen", meta: { category: "gebruikers" } });
    expect(log.actorId).toBeUndefined();

    // Nog een keer: bestaat niet meer.
    expect(await purgeUser(anna._id)).toBeNull();
    expect(await AuditLog.countDocuments()).toBe(1);
  });
});

describe("opruimen", () => {
  it("verwijdert verlopen en ingetrokken uitnodigingen na 30 dagen, geaccepteerde niet", async () => {
    const { org } = await createOrgWithUser();
    const invite = (token: string, extra: Record<string, unknown>) => Invite.create({ token, orgId: org._id, email: `${token}@testorg.nl`, ...extra });
    await invite("verlopen-oud", { expiresAt: daysAgo(31) });
    await invite("verlopen-recent", { expiresAt: daysAgo(10) });
    await invite("ingetrokken-oud", { expiresAt: addDays(now, 5), revokedAt: daysAgo(31) });
    await invite("ingetrokken-recent", { expiresAt: daysAgo(40), revokedAt: daysAgo(5) });
    await invite("geaccepteerd", { expiresAt: daysAgo(60), acceptedAt: daysAgo(70) });
    await invite("open", { expiresAt: addDays(now, 7) });

    // "ingetrokken-recent" is ook al ruim 30 dagen verlopen.
    expect((await opruimen(now)).uitnodigingen).toBe(3);
    const left = (await Invite.find().lean()).map((i) => i.token).sort();
    expect(left).toEqual(["geaccepteerd", "open", "verlopen-recent"]);
  });

  it("verwijdert accounts 30 dagen na het verzoek", async () => {
    const { org, user } = await createOrgWithUser("Noord", "oud@noord.nl", { deletionRequestedAt: daysAgo(31) });
    const recent = await User.create({ email: "recent@noord.nl", orgId: org._id, deletionRequestedAt: daysAgo(10) });
    await seedData(user, "a");

    expect((await opruimen(now)).verzoeken).toBe(1);
    expect(await User.exists({ _id: user._id })).toBeNull();
    expect(await User.exists({ _id: recent._id })).toBeTruthy();
    expect(await AuditLog.exists({ action: "Account verwijderd na verzoek" })).toBeTruthy();
    expect((await opruimen(now)).verzoeken).toBe(0);
  });

  it("houdt zich aan de bewaartermijn van de organisatie, en ruimt bij 'tot einde contract' niets op", async () => {
    const { org } = await createOrgWithUser("Noord", "admin@noord.nl");
    await Organization.updateOne({ _id: org._id }, { retention: "12" });
    const make = (email: string, orgId: Types.ObjectId, extra: Record<string, unknown>) => User.create({ email, orgId, ...extra });
    const expired = await make("verlopen@noord.nl", org._id, { status: "gedeactiveerd", deactivatedAt: monthsAgo(13) });
    const within = await make("binnen@noord.nl", org._id, { status: "gedeactiveerd", deactivatedAt: monthsAgo(11) });
    const active = await make("actief@noord.nl", org._id, { status: "actief", deactivatedAt: monthsAgo(30) });

    const contract = await createOrgWithUser("Contract", "admin@contract.nl");
    await Organization.updateOne({ _id: contract.org._id }, { retention: "contract" });
    const forever = await make("lang@contract.nl", contract.org._id, { status: "gedeactiveerd", deactivatedAt: monthsAgo(60) });

    expect((await opruimen(now)).bewaartermijn).toBe(1);
    expect(await User.exists({ _id: expired._id })).toBeNull();
    for (const kept of [within, active, forever]) expect(await User.exists({ _id: kept._id })).toBeTruthy();
    expect(await AuditLog.exists({ orgId: org._id, action: "Gegevens verwijderd na bewaartermijn", actorName: "Systeem" })).toBeTruthy();
  });

  it("verwijdert een organisatie 14 dagen na het verzoek, en alleen die", async () => {
    const orgModels = Object.values(mongoose.models).filter((m) => m.schema.path("orgId"));
    const orgCounts = async (orgId: Types.ObjectId) =>
      Object.fromEntries(await Promise.all(orgModels.map(async (m) => [m.modelName, await m.countDocuments({ orgId })] as const)));

    async function filledOrg(name: string, requestedDaysAgo?: number) {
      const { org, team, user } = await createOrgWithUser(name, `a@${name}.nl`);
      if (requestedDaysAgo !== undefined) await Organization.updateOne({ _id: org._id }, { deletionRequestedAt: daysAgo(requestedDaysAgo) });
      await seedData(user, name);
      await Assignment.create({ orgId: org._id, pathSlug: "ai-101", teamIds: [team._id], userIds: [user._id] });
      await AuditLog.create({ orgId: org._id, action: "Iets" });
      await LeaderboardSnapshot.create({ orgId: org._id, month: "2026-09", entries: [{ userId: user._id, rank: 1, points: 10 }] });
      return { org, user };
    }

    const doomed = await filledOrg("weg", 15);
    const pending = await filledOrg("bijna", 5);
    const normal = await filledOrg("blijft");
    const before = { pending: await orgCounts(pending.org._id), normal: await orgCounts(normal.org._id) };

    expect(await opruimen(now)).toMatchObject({ organisaties: 1, organisatieGebruikers: 1 });
    expect(await Organization.exists({ _id: doomed.org._id })).toBeNull();
    const doomedCounts = await orgCounts(doomed.org._id);
    expect(doomedCounts).toEqual(allZeros(doomedCounts));
    const user = await countsFor(doomed.user);
    expect(user).toEqual(allZeros(user));
    expect(await Team.countDocuments({ orgId: doomed.org._id })).toBe(0);

    expect(await orgCounts(pending.org._id)).toEqual(before.pending);
    expect(await orgCounts(normal.org._id)).toEqual(before.normal);
    expect(await Organization.countDocuments()).toBe(2);
    const kept = await countsFor(normal.user);
    expect(kept).toEqual(allOnes(kept));
  });

  it("geeft nullen bij een tweede run", async () => {
    await createOrgWithUser("Noord", "oud@noord.nl", { deletionRequestedAt: daysAgo(31) });
    await opruimen(now);
    expect(await opruimen(now)).toEqual({
      organisaties: 0,
      organisatieGebruikers: 0,
      verzoeken: 0,
      bewaartermijn: 0,
      uitnodigingen: 0,
      taakruns: 0,
      prompts: 0,
      demoAanvragen: 0,
      auditregels: 0,
      certificaten: 0,
    });
  });

  it("houdt certificaten na de bewaartermijn verifieerbaar, maar niet na een eigen verwijderverzoek", async () => {
    const { org } = await createOrgWithUser("Noord", "admin@noord.nl");
    await Organization.updateOne({ _id: org._id }, { retention: "12" });
    const retired = await User.create({ email: "oud@noord.nl", orgId: org._id, status: "gedeactiveerd", deactivatedAt: monthsAgo(13) });
    const leaving = await User.create({ email: "weg@noord.nl", orgId: org._id, deletionRequestedAt: daysAgo(31) });
    for (const [user, number] of [[retired, "C-OUD"], [leaving, "C-WEG"]] as const) {
      await Certificate.create({ userId: user._id, orgId: org._id, number, pathSlug: "ai-101", holderName: "Naam", score: 90 });
    }

    await opruimen(now);
    expect(await Certificate.exists({ number: "C-OUD" })).toBeTruthy();
    expect(await Certificate.exists({ number: "C-WEG" })).toBeNull();
  });

  it("ruimt prompts na 90 dagen, demo-aanvragen na 12 maanden, auditregels na 24 maanden en certificaten na 10 jaar op", async () => {
    const { org, user } = await createOrgWithUser("Noord", "a@noord.nl");
    await PracticeAttempt.create([
      { userId: user._id, orgId: org._id, exerciseSlug: "x", prompt: "oud", score: 80, createdAt: daysAgo(91) },
      { userId: user._id, orgId: org._id, exerciseSlug: "x", prompt: "nieuw", score: 70, createdAt: daysAgo(10) },
    ]);
    await DemoRequest.create([{ email: "oud@x.nl", createdAt: monthsAgo(13) }, { email: "nieuw@x.nl", createdAt: monthsAgo(2) }]);
    await AuditLog.create([
      { orgId: org._id, action: "oud", createdAt: monthsAgo(25) },
      { orgId: org._id, action: "nieuw", createdAt: monthsAgo(3) },
    ]);
    await Certificate.create([
      { userId: user._id, orgId: org._id, number: "C-1", pathSlug: "ai-101", holderName: "A", score: 90, issuedAt: monthsAgo(121) },
      { userId: user._id, orgId: org._id, number: "C-2", pathSlug: "ui-ux-design", holderName: "A", score: 90, issuedAt: monthsAgo(12) },
    ]);

    const result = await opruimen(now);
    expect(result).toMatchObject({ prompts: 1, demoAanvragen: 1, auditregels: 1, certificaten: 1 });
    const attempts = await PracticeAttempt.find({ userId: user._id }).sort({ createdAt: 1 }).lean();
    expect(attempts.map((a) => a.prompt)).toEqual([undefined, "nieuw"]);
    expect(attempts[0].score).toBe(80);
    expect(await DemoRequest.exists({ email: "nieuw@x.nl" })).toBeTruthy();
    expect(await AuditLog.exists({ action: "nieuw" })).toBeTruthy();
    expect(await Certificate.exists({ number: "C-2" })).toBeTruthy();
  });
});
