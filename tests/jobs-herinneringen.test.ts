import type { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { allChapters, getLearningPath } from "@/lib/content";
import { ActivityDay, Assignment, Certificate, Notification, Organization, TaskProgress, Team, User, type notificationTypes } from "@/server/models";
import { herinneringen } from "@/server/jobs/herinneringen";
import { createOrgWithUser, setupTestDb } from "./helpers/db";

setupTestDb();

// Geen mail-uitvoer in de testlog.
beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

// Tijden in Amsterdam (oktober 2026, zomertijd). Woensdag 14 oktober; zaterdag 17 oktober.
const at = (local: string) => new Date(`2026-${local}+02:00`);

function learner(orgId: Types.ObjectId, teamId: Types.ObjectId | undefined, email: string, extra: Record<string, unknown> = {}) {
  return User.create({
    email,
    firstName: email.split("@")[0],
    lastName: "Test",
    orgId,
    teamId,
    onboarding: { completedAt: new Date() },
    ...extra,
  });
}

const learned = (user: { _id: Types.ObjectId; orgId?: Types.ObjectId | null }, ...dates: string[]) =>
  ActivityDay.insertMany(dates.map((date) => ({ userId: user._id, orgId: user.orgId, date, minutes: 10 })));

const notificationsOf = (userId: Types.ObjectId, type: (typeof notificationTypes)[number]) => Notification.find({ userId, type }).sort({ _id: 1 }).lean();

describe("dagelijkse herinnering", () => {
  it("gaat op werkdagen naar wie zijn tijd voorbij is en vandaag nog niet leerde, één keer per dag", async () => {
    const { org, team, user } = await createOrgWithUser("Noord", "a@noord.nl"); // standaard 09:00
    const late = await learner(org._id, team._id, "laat@noord.nl", { settings: { learning: { reminderTime: "18:00" } } });
    const busy = await learner(org._id, team._id, "bezig@noord.nl");
    await learned(busy, "2026-10-14");
    const off = await learner(org._id, team._id, "uit@noord.nl", { settings: { learning: { dailyReminder: false } } });
    const notOnboarded = await User.create({ email: "nieuw@noord.nl", orgId: org._id, teamId: team._id });
    const deactivated = await learner(org._id, team._id, "weg@noord.nl", { status: "gedeactiveerd" });
    const muted = await learner(org._id, team._id, "stil@noord.nl", {
      settings: { notifications: { reminders: { inApp: false, email: false } } },
    });

    expect((await herinneringen(at("10-14T10:00:00"))).dagelijks).toBe(1);
    expect(await notificationsOf(user._id, "reminder")).toHaveLength(1);
    for (const other of [late, busy, off, notOnboarded, deactivated, muted]) {
      expect(await notificationsOf(other._id, "reminder")).toHaveLength(0);
    }

    // Later op de dag (of bij een run per uur): niets dubbel.
    expect((await herinneringen(at("10-14T13:00:00"))).dagelijks).toBe(0);
    // Om 18:30 is de late tijd ook voorbij.
    expect((await herinneringen(at("10-14T18:30:00"))).dagelijks).toBe(1);
    expect(await notificationsOf(late._id, "reminder")).toHaveLength(1);
    expect(await notificationsOf(user._id, "reminder")).toHaveLength(1);

    // Volgende werkdag weer (nu ook voor wie gisteren wel leerde), in het weekend niet.
    expect((await herinneringen(at("10-15T10:00:00"))).dagelijks).toBe(2);
    expect((await herinneringen(at("10-17T19:00:00"))).dagelijks).toBe(0);
  });

  it("verwijst naar het hoofdstuk waar je gebleven was", async () => {
    const { user } = await createOrgWithUser();
    const path = (await getLearningPath("ai-101"))!;
    const [first] = allChapters(path);
    await TaskProgress.create({ userId: user._id, orgId: user.orgId, pathSlug: path.slug, chapterId: first.id, taskId: first.tasks[0].id });

    await herinneringen(at("10-14T10:00:00"));
    const [reminder] = await notificationsOf(user._id, "reminder");
    expect(reminder.href).toBe(`/leerpaden/ai-101/${first.slug}`);
    expect(reminder.body).toContain(first.title);
  });

  it("slaat organisaties over die verwijderd worden", async () => {
    const { org, user } = await createOrgWithUser();
    await Organization.updateOne({ _id: org._id }, { deletionRequestedAt: new Date() });
    expect((await herinneringen(at("10-14T10:00:00"))).dagelijks).toBe(0);
    expect(await notificationsOf(user._id, "reminder")).toHaveLength(0);
  });

  it("volgt de voorkeur bij Herinneringen: alleen e-mail, ook maar één keer", async () => {
    const { user } = await createOrgWithUser("Noord", "mail@noord.nl", {
      settings: { notifications: { reminders: { inApp: false, email: true }, streak: { inApp: false, email: false } } },
    });
    const mails = () => vi.mocked(console.info).mock.calls.filter(([text]) => String(text).includes("Tijd voor je dagelijkse les"));

    expect((await herinneringen(at("10-14T10:00:00"))).dagelijks).toBe(1);
    expect(mails()).toHaveLength(1);
    expect(String(mails()[0][0])).toContain("mail@noord.nl");
    expect(await notificationsOf(user._id, "reminder")).toHaveLength(0);

    expect((await herinneringen(at("10-14T15:00:00"))).dagelijks).toBe(0);
    expect(mails()).toHaveLength(1);
  });

  it("probeert het de volgende run opnieuw als een melding niet aankwam", async () => {
    const { user } = await createOrgWithUser();
    vi.spyOn(Notification, "create").mockRejectedValueOnce(new Error("Database weg"));

    await expect(herinneringen(at("10-14T10:00:00"))).rejects.toThrow("Database weg");
    expect(await notificationsOf(user._id, "reminder")).toHaveLength(0);
    expect((await herinneringen(at("10-14T11:00:00"))).dagelijks).toBe(1);
    expect(await notificationsOf(user._id, "reminder")).toHaveLength(1);
  });

  it("werkt met één run per dag om 15:00 UTC, in zomer- en wintertijd", async () => {
    const { org, team, user } = await createOrgWithUser("Noord", "a@noord.nl");
    const streaker = await learner(org._id, team._id, "reeks@noord.nl");
    await learned(streaker, "2026-10-12", "2026-10-13", "2026-12-07", "2026-12-08");

    // Woensdag 14 oktober, 17:00 in Amsterdam.
    expect(await herinneringen(new Date("2026-10-14T15:00:00Z"))).toMatchObject({ dag: "2026-10-14", dagelijks: 1, streak: 1 });
    // Woensdag 9 december, 16:00 in Amsterdam.
    expect(await herinneringen(new Date("2026-12-09T15:00:00Z"))).toMatchObject({ dag: "2026-12-09", dagelijks: 1, streak: 1 });
    expect(await notificationsOf(user._id, "reminder")).toHaveLength(2);
    expect(await notificationsOf(streaker._id, "streak")).toHaveLength(2);
  });
});

describe("streak in gevaar", () => {
  it("waarschuwt vanaf 16:00 wie gisteren leerde, vandaag nog niet, met een streak van minstens 2", async () => {
    const noReminder = { settings: { learning: { dailyReminder: false } } };
    const { org, team, user } = await createOrgWithUser("Noord", "a@noord.nl", noReminder);
    await learned(user, "2026-10-12", "2026-10-13");
    const single = await learner(org._id, team._id, "een@noord.nl", noReminder);
    await learned(single, "2026-10-13");
    const safe = await learner(org._id, team._id, "veilig@noord.nl", noReminder);
    await learned(safe, "2026-10-12", "2026-10-13", "2026-10-14");

    expect((await herinneringen(at("10-14T15:00:00"))).streak).toBe(0);
    expect((await herinneringen(at("10-14T17:00:00"))).streak).toBe(1);
    expect((await herinneringen(at("10-14T20:00:00"))).streak).toBe(0);

    const [warning] = await notificationsOf(user._id, "streak");
    expect(warning.title).toContain("2 dagen");
    expect(await Notification.countDocuments({ type: "streak" })).toBe(1);
  });

  it("stuurt dan niet ook nog een losse herinnering (één run per dag)", async () => {
    const { org, team, user } = await createOrgWithUser();
    await learned(user, "2026-10-11", "2026-10-12", "2026-10-13");
    const fresh = await learner(org._id, team._id, "b@testorg.nl");

    const summary = await herinneringen(at("10-14T17:00:00"));
    expect(summary).toMatchObject({ streak: 1, dagelijks: 1 });
    expect(await notificationsOf(user._id, "streak")).toHaveLength(1);
    expect(await notificationsOf(user._id, "reminder")).toHaveLength(0);
    expect(await notificationsOf(fresh._id, "reminder")).toHaveLength(1);

    expect((await herinneringen(at("10-14T18:00:00"))).dagelijks).toBe(0);
  });
});

describe("deadlines", () => {
  async function setup() {
    const { org, team, user } = await createOrgWithUser("Noord", "a@noord.nl");
    const path = (await getLearningPath("ai-101"))!;

    const finished = await learner(org._id, team._id, "klaar@noord.nl");
    await TaskProgress.insertMany(
      allChapters(path).flatMap((c) =>
        c.tasks.map((t) => ({ userId: finished._id, orgId: org._id, pathSlug: path.slug, chapterId: c.id, taskId: t.id })),
      ),
    );
    const certified = await learner(org._id, team._id, "cert@noord.nl");
    await Certificate.create({ number: "C-1", userId: certified._id, orgId: org._id, pathSlug: path.slug, holderName: "Cert", score: 90 });
    const deactivated = await learner(org._id, team._id, "weg@noord.nl", { status: "gedeactiveerd" });

    const otherTeam = await Team.create({ orgId: org._id, name: "Development" });
    const individual = await learner(org._id, otherTeam._id, "los@noord.nl");
    const bystander = await learner(org._id, otherTeam._id, "niet@noord.nl");
    const outsider = await createOrgWithUser("Zuid", "x@zuid.nl");

    const assignment = await Assignment.create({
      orgId: org._id,
      pathSlug: path.slug,
      teamIds: [team._id],
      userIds: [individual._id, outsider.user._id],
      deadline: at("10-21T23:59:59"),
    });
    return { user, finished, certified, deactivated, individual, bystander, outsider: outsider.user, assignment };
  }

  it("meldt 7, 3 en 1 dag(en) van tevoren, aan wie het pad nog niet af heeft", async () => {
    const people = await setup();

    // Vóór 9 uur niets, ook al is het precies een week van tevoren.
    expect((await herinneringen(at("10-14T08:00:00"))).deadlines).toBe(0);
    expect((await herinneringen(at("10-14T10:00:00"))).deadlines).toBe(2);
    const [first] = await notificationsOf(people.user._id, "assignment");
    expect(first.title).toBe("Deadline over 7 dagen: AI 101");
    expect(first.href).toBe("/leerpaden/ai-101");
    expect(await notificationsOf(people.individual._id, "assignment")).toHaveLength(1);
    for (const skipped of [people.finished, people.certified, people.deactivated, people.bystander, people.outsider]) {
      expect(await notificationsOf(skipped._id, "assignment")).toHaveLength(0);
    }

    // Zelfde dag en de dag erna (nog steeds de 7-dagenmelding): niets nieuws.
    expect((await herinneringen(at("10-14T16:00:00"))).deadlines).toBe(0);
    expect((await herinneringen(at("10-15T10:00:00"))).deadlines).toBe(0);
    expect((await herinneringen(at("10-18T10:00:00"))).deadlines).toBe(2);
    expect((await herinneringen(at("10-20T10:00:00"))).deadlines).toBe(2);
    // Op de dag zelf is de 1-dagmelding al verstuurd.
    expect((await herinneringen(at("10-21T10:00:00"))).deadlines).toBe(0);

    const titles = (await notificationsOf(people.user._id, "assignment")).map((n) => n.title);
    expect(titles).toEqual(["Deadline over 7 dagen: AI 101", "Deadline over 3 dagen: AI 101", "Deadline morgen: AI 101"]);
    // Na de deadline niets meer.
    expect((await herinneringen(at("10-22T10:00:00"))).deadlines).toBe(0);
  });

  it("deelt in op resterende dagen, zodat een gemiste run de melding niet overslaat", async () => {
    const people = await setup();
    // Eerste run pas 5 dagen voor de deadline: dan alsnog de 7-dagenmelding, met het echte aantal dagen.
    expect((await herinneringen(at("10-16T10:00:00"))).deadlines).toBe(2);
    const [first] = await notificationsOf(people.user._id, "assignment");
    expect(first.title).toBe("Deadline over 5 dagen: AI 101");
    // Twee dagen gemist: dan direct de 1-dagmelding (3 is al voorbij).
    expect((await herinneringen(at("10-20T10:00:00"))).deadlines).toBe(2);
    expect(await notificationsOf(people.user._id, "assignment")).toHaveLength(2);
  });

  it("negeert verwijderde toewijzingen en deadlines die nog ver weg zijn", async () => {
    const { org, team, user } = await createOrgWithUser();
    await Assignment.create({ orgId: org._id, pathSlug: "ai-101", teamIds: [team._id], deadline: at("10-17T23:59:59"), deletedAt: new Date() });
    await Assignment.create({ orgId: org._id, pathSlug: "ai-101", teamIds: [team._id], deadline: at("10-30T23:59:59") });
    await Assignment.create({ orgId: org._id, pathSlug: "ai-101", teamIds: [team._id], deadline: at("10-13T23:59:59") });
    expect((await herinneringen(at("10-14T10:00:00"))).deadlines).toBe(0);
    expect(await notificationsOf(user._id, "assignment")).toHaveLength(0);
  });

  it("telt opnieuw als de deadline verschuift", async () => {
    const people = await setup();
    await herinneringen(at("10-14T10:00:00"));
    await Assignment.updateOne({ _id: people.assignment._id }, { deadline: at("10-23T23:59:59") });
    expect((await herinneringen(at("10-16T10:00:00"))).deadlines).toBe(2);
  });
});
