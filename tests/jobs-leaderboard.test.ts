import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { LeaderboardSnapshot, Notification, Organization, PointEvent, Team, User, UserBadge } from "@/server/models";
import { leaderboardMaand, rankMembers } from "@/server/jobs/leaderboard-maand";
import { createOrgWithUser, setupTestDb } from "./helpers/db";

setupTestDb();

const amsterdam = (local: string) => new Date(`${local}+02:00`);
let ref = 0;

async function points(user: { _id: Types.ObjectId; orgId?: Types.ObjectId | null }, amount: number, createdAt: Date) {
  await PointEvent.create({ userId: user._id, orgId: user.orgId ?? undefined, amount, reason: "start", refId: `p${ref++}`, createdAt });
}

async function setup() {
  const { org, team, user: anna } = await createOrgWithUser("Noord", "anna@noord.nl", { firstName: "Anna" });
  const member = (email: string, teamId = team._id, extra: Record<string, unknown> = {}) =>
    User.create({ email, firstName: email.split("@")[0], lastName: "Test", orgId: org._id, teamId, ...extra });
  const [bo, cas, dirk, eva] = await Promise.all(["bo@noord.nl", "cas@noord.nl", "dirk@noord.nl", "eva@noord.nl"].map((e) => member(e)));
  const hidden = await member("verborgen@noord.nl", team._id, { settings: { privacy: { showOnLeaderboard: false } } });
  const dev = await Team.create({ orgId: org._id, name: "Development" });
  const [fien, gijs] = await Promise.all([member("fien@noord.nl", dev._id), member("gijs@noord.nl", dev._id)]);

  // September 2026, met de randen van de Amsterdamse maand.
  await points(anna, 250, amsterdam("2026-09-15T12:00:00"));
  await points(anna, 50, amsterdam("2026-09-30T23:30:00"));
  await points(anna, 999, amsterdam("2026-10-01T00:30:00"));
  await points(anna, 500, amsterdam("2026-08-31T23:30:00"));
  await points(bo, 200, amsterdam("2026-09-10T12:00:00"));
  await points(cas, 100, amsterdam("2026-09-10T12:00:00"));
  await points(dirk, 50, amsterdam("2026-09-10T12:00:00"));
  await points(hidden, 1000, amsterdam("2026-09-10T12:00:00"));
  await points(fien, 80, amsterdam("2026-09-10T12:00:00"));
  return { org, team, dev, anna, bo, cas, dirk, eva, hidden, fien, gijs };
}

const oktober = amsterdam("2026-10-02T07:00:00");

describe("leaderboard-maand", () => {
  it("legt per team de stand van de vorige maand vast en geeft de top 3 de badge", async () => {
    const p = await setup();
    const summary = await leaderboardMaand(oktober);
    expect(summary).toEqual({ maand: "2026-09", organisaties: 1, momentopnames: 3, badges: 4, meldingen: 4 });

    const design = await LeaderboardSnapshot.findOne({ teamId: p.team._id, month: "2026-09" }).lean();
    expect(design!.entries.map((e) => [String(e.userId), e.rank, e.points])).toEqual([
      [String(p.anna._id), 1, 300],
      [String(p.bo._id), 2, 200],
      [String(p.cas._id), 3, 100],
      [String(p.dirk._id), 4, 50],
      [String(p.eva._id), 5, 0],
    ]);
    // Afgemeld voor het leaderboard: niet in de stand van het team en niet in die van de organisatie.
    const overall = await LeaderboardSnapshot.findOne({ orgId: p.org._id, teamId: null, month: "2026-09" }).lean();
    expect(overall!.entries).toHaveLength(7);
    expect(overall!.entries.some((e) => p.hidden._id.equals(e.userId!))).toBe(false);

    const winners = (await UserBadge.find({ code: "T3" }).lean()).map((b) => String(b.userId)).sort();
    // In Development heeft alleen Fien punten; Gijs (0 punten) krijgt niets.
    expect(winners).toEqual([p.anna, p.bo, p.cas, p.fien].map((u) => String(u._id)).sort());
    const [melding] = await Notification.find({ userId: p.anna._id, type: "badge" }).lean();
    expect(melding.title).toBe("Badge behaald: Top 3");
    expect(melding.body).toContain("september 2026");
  });

  it("doet niets als de maand al is vastgelegd", async () => {
    await setup();
    await leaderboardMaand(oktober);
    const again = await leaderboardMaand(amsterdam("2026-10-15T07:00:00"));
    expect(again).toEqual({ maand: "2026-09", organisaties: 0, momentopnames: 0, badges: 0, meldingen: 0 });
    expect(await LeaderboardSnapshot.countDocuments()).toBe(3);
    expect(await UserBadge.countDocuments({ code: "T3" })).toBe(4);
    expect(await Notification.countDocuments({ type: "badge" })).toBe(4);
  });

  it("geeft de badge één keer; wie hem al heeft krijgt alleen een melding", async () => {
    const p = await setup();
    await leaderboardMaand(oktober);
    const november = await leaderboardMaand(amsterdam("2026-11-02T07:00:00"));
    expect(november.maand).toBe("2026-10");
    // In oktober heeft alleen Anna punten (999).
    expect(november).toMatchObject({ badges: 0, meldingen: 1 });
    expect(await UserBadge.countDocuments({ userId: p.anna._id, code: "T3" })).toBe(1);
    const titles = (await Notification.find({ userId: p.anna._id, type: "badge" }).sort({ _id: 1 }).lean()).map((n) => n.title);
    expect(titles).toEqual(["Badge behaald: Top 3", "Weer in de top 3 van Design"]);
  });

  it("maakt een afgebroken run af met de stand die al was vastgelegd", async () => {
    const p = await setup();
    await LeaderboardSnapshot.create({ orgId: p.org._id, teamId: p.team._id, month: "2026-09", entries: [{ userId: p.dirk._id, rank: 1, points: 50 }] });
    const summary = await leaderboardMaand(oktober);
    expect(summary.momentopnames).toBe(2);
    expect(await UserBadge.exists({ userId: p.dirk._id, code: "T3" })).toBeTruthy();
    expect(await UserBadge.exists({ userId: p.anna._id, code: "T3" })).toBeFalsy();
  });

  it("volgt voor de melding de voorkeur bij Certificaten en badges", async () => {
    const p = await setup();
    await User.updateOne({ _id: p.bo._id }, { "settings.notifications.certificates": { inApp: false, email: false } });
    const summary = await leaderboardMaand(oktober);
    expect(summary).toMatchObject({ badges: 4, meldingen: 3 });
    expect(await UserBadge.exists({ userId: p.bo._id, code: "T3" })).toBeTruthy();
    expect(await Notification.exists({ userId: p.bo._id, type: "badge" })).toBeNull();
  });

  it("laat wie om verwijdering vroeg buiten de stand", async () => {
    const p = await setup();
    await User.updateOne({ _id: p.anna._id }, { deletionRequestedAt: new Date() });
    await leaderboardMaand(oktober);
    const design = await LeaderboardSnapshot.findOne({ teamId: p.team._id, month: "2026-09" }).lean();
    expect(design!.entries.some((e) => p.anna._id.equals(e.userId!))).toBe(false);
    expect(design!.entries[0]).toMatchObject({ userId: p.bo._id, rank: 1 });
    expect(await UserBadge.exists({ userId: p.anna._id, code: "T3" })).toBeNull();
    expect(await UserBadge.exists({ userId: p.dirk._id, code: "T3" })).toBeTruthy();
  });

  it("slaat organisaties over die verwijderd worden", async () => {
    const p = await setup();
    await Organization.updateOne({ _id: p.org._id }, { deletionRequestedAt: new Date() });
    expect((await leaderboardMaand(oktober)).organisaties).toBe(0);
    expect(await LeaderboardSnapshot.countDocuments()).toBe(0);
  });
});

describe("rankMembers", () => {
  it("laat gelijke punten een plek delen", () => {
    const [a, b, c] = [new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId()];
    const ranked = rankMembers(
      [
        { _id: c, name: "Cas" },
        { _id: a, name: "Anna" },
        { _id: b, name: "Bo" },
      ],
      new Map([
        [String(a), 100],
        [String(b), 100],
        [String(c), 50],
      ]),
    );
    expect(ranked.map((e) => [String(e.userId), e.rank])).toEqual([
      [String(a), 1],
      [String(b), 1],
      [String(c), 3],
    ]);
  });
});
