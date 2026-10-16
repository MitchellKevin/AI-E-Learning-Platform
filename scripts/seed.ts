/**
 * Vult de database met de demo-organisatie Studio Noord (en een tweede organisatie om afscherming te testen).
 * Gebruik: pnpm db:seed   (leest MONGODB_URI uit .env.local)
 */
import { randomBytes } from "node:crypto";
import mongoose, { type Types } from "mongoose";
import { learningPaths } from "@/lib/mock-content";
import { mockProgress, mockBadges, mockCertificates } from "@/lib/mock-user";
import { mockLeaderboardMembers } from "@/lib/mock/leaderboard";
import { mockAssignments, mockMembers } from "@/lib/mock/admin-team";
import { mockAuditLog } from "@/lib/mock/admin-org";
import { mockNotifications } from "@/lib/mock/shell";
import { mockSettings } from "@/lib/mock/profile";
import { connectDb, disconnectDb } from "@/server/db";
import {
  ActivityDay,
  Assignment,
  AuditLog,
  Certificate,
  Enrollment,
  ExamAttempt,
  Invite,
  Notification,
  Organization,
  PointEvent,
  Team,
  TaskProgress,
  User,
  UserBadge,
  type UserRole,
} from "@/server/models";
import { addDays, dayKey, startOfMonth } from "@/server/services/dates";

const now = new Date();
const daysAgo = (n: number) => addDays(now, -n);

// [naam, team, rol, status] — gelijk aan het gebruikersbeheer in de frontend.
const people: [string, string, UserRole, "actief" | "gedeactiveerd"][] = [
  ["Sanne Visser", "Design", "admin", "actief"],
  ["Lotte Meijer", "Design", "manager", "actief"],
  ["Tim Bakker", "Design", "learner", "actief"],
  ["Lisa de Jong", "Design", "learner", "actief"],
  ["Mo Kaddouri", "Design", "learner", "actief"],
  ["Noor Jansen", "Design", "learner", "actief"],
  ["Daan Smit", "Design", "learner", "actief"],
  ["Fleur Mulder", "Design", "learner", "actief"],
  ["Jesse de Vries", "Design", "learner", "actief"],
  ["Yara El Amrani", "Design", "learner", "actief"],
  ["Bram Peeters", "Design", "learner", "actief"],
  ["Iris van Dijk", "Design", "learner", "actief"],
  ["Ruben Bos", "Design", "learner", "actief"],
  ["Eva Hendriks", "Design", "learner", "actief"],
  ["Kevin Janssen", "Development", "manager", "actief"],
  ["Sophie de Boer", "Development", "learner", "actief"],
  ["Ahmed Yilmaz", "Development", "learner", "actief"],
  ["Julia van den Berg", "Development", "learner", "actief"],
  ["Max de Graaf", "Development", "learner", "actief"],
  ["Nina Dekker", "Development", "learner", "actief"],
  ["Esra Demir", "Strategie", "admin", "actief"],
  ["Wouter Brouwer", "Strategie", "learner", "actief"],
  ["Bas Vermeulen", "Development", "learner", "gedeactiveerd"],
  ["Anouk Smit", "Strategie", "learner", "gedeactiveerd"],
];

const emailFor = (name: string) => `${name.split(" ")[0].toLowerCase()}@studionoord.nl`;
const splitName = (name: string) => {
  const [firstName, ...rest] = name.split(" ");
  return { firstName, lastName: rest.join(" ") };
};

// Deterministische "willekeur", zodat elke seed hetzelfde oplevert.
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const chaptersOf = (slug: string) => learningPaths.find((p) => p.slug === slug)!.topics.flatMap((t) => t.chapters);

async function reset() {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
  // Indexen opnieuw opbouwen volgens de schema's.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

async function seedStudioNoord() {
  const org = await Organization.create({
    name: "Studio Noord",
    legalName: "Studio Noord B.V.",
    website: "https://studionoord.nl",
    slug: "studio-noord",
    initials: "SN",
    plan: "team",
    seats: 25,
    domains: [
      { domain: "studionoord.nl", verified: true, addedAt: daysAgo(226) },
      { domain: "noord.studio", verified: false, addedAt: daysAgo(6) },
    ],
    autoJoin: true,
    sso: {
      provider: "microsoft",
      status: "verbonden",
      tenant: "studionoord.onmicrosoft.com",
      connectedAt: daysAgo(224),
      lastSyncAt: daysAgo(0.4),
      enforced: false,
    },
    retention: "24",
    dpa: { version: "2.1", signedAt: daysAgo(228), signedBy: "Esra Demir" },
    createdAt: daysAgo(228),
  });

  const teams = Object.fromEntries(
    await Promise.all(
      ["Design", "Development", "Strategie"].map(async (name) => [name, await Team.create({ orgId: org._id, name })] as const),
    ),
  );
  org.autoJoinTeamId = teams.Design._id;
  await org.save();

  const users = new Map<string, Types.ObjectId>();
  for (const [name, team, role, status] of people) {
    const member = mockMembers.find((m) => m.name === name);
    const isSanne = name === "Sanne Visser";
    const user = await User.create({
      email: emailFor(name),
      emailVerified: daysAgo(180),
      ...splitName(name),
      jobTitle: isSanne ? mockSettings.account.jobTitle : (member?.role ?? ""),
      orgId: org._id,
      teamId: teams[team]._id,
      role,
      status,
      loginProvider: "Microsoft Entra ID",
      lastActiveAt: member?.lastActiveAt ? new Date(member.lastActiveAt) : daysAgo(1),
      onboarding: { completedAt: daysAgo(180), role: team === "Development" ? "developer" : "designer", level: "beginner", goals: ["workflow"] },
      ...(isSanne && {
        settings: { learning: mockSettings.learning, notifications: mockSettings.notifications, privacy: mockSettings.privacy, language: mockSettings.language },
      }),
      createdAt: daysAgo(isSanne ? 60 : 200),
    });
    users.set(name, user._id);
  }

  const idOf = (name: string) => users.get(name)!;
  const sanne = idOf("Sanne Visser");

  // Voortgang: Sanne precies zoals in het ontwerp, de rest afgeleid van hun voortgang per leerpad.
  const progressDocs: Record<string, unknown>[] = [];
  for (const [chapterId, taskIds] of Object.entries(mockProgress.completedTasks)) {
    for (const taskId of taskIds) {
      progressDocs.push({ userId: sanne, orgId: org._id, pathSlug: chapterId.split("/")[0], chapterId, taskId, completedAt: daysAgo(30) });
    }
  }
  for (const member of mockMembers) {
    const userId = users.get(member.name);
    if (!userId || userId.equals(sanne)) continue;
    for (const path of member.paths) {
      const chapters = chaptersOf(path.slug);
      const done = Math.round((path.progress / 100) * chapters.length);
      chapters.slice(0, done).forEach((chapter, i) => {
        for (const task of chapter.tasks) {
          progressDocs.push({
            userId,
            orgId: org._id,
            pathSlug: path.slug,
            chapterId: chapter.id,
            taskId: task.id,
            completedAt: daysAgo(Math.max(1, 120 - i * 4)),
          });
        }
      });
      if (path.progress > 0 && path.slug !== "ai-101") {
        await Enrollment.create({ userId, orgId: org._id, pathSlug: path.slug, chosenAt: daysAgo(60) });
      }
      if (path.completedAt && path.examScore) {
        const attempt = await ExamAttempt.create({
          userId,
          orgId: org._id,
          pathSlug: path.slug,
          score: path.examScore,
          passed: true,
          startedAt: new Date(path.completedAt),
          submittedAt: new Date(path.completedAt),
        });
        await Certificate.create({
          number: `AIA-${path.slug === "ai-101" ? "101" : path.slug === "ui-ux-design" ? "UX" : "SD"}-2026-${String(Math.floor(seeded(member.name + path.slug)() * 9000) + 1000)}`,
          userId,
          orgId: org._id,
          pathSlug: path.slug,
          holderName: member.name,
          score: path.examScore,
          attemptId: attempt._id,
          issuedAt: new Date(path.completedAt),
        });
      }
    }
  }
  await TaskProgress.insertMany(progressDocs);

  // Demo-certificaat van Sanne, zodat het certificaatscherm te bekijken is.
  for (const cert of mockCertificates) {
    await Certificate.create({
      number: cert.number,
      userId: sanne,
      orgId: org._id,
      pathSlug: cert.pathSlug,
      holderName: "Sanne Visser",
      score: cert.score,
      issuedAt: new Date(cert.issuedAt),
    });
  }

  // Punten: historische totalen uit het leaderboard, verdeeld over de periodes (week, vorige week, maand, ooit).
  const monthStart = startOfMonth(now);
  const pointDocs: Record<string, unknown>[] = [];
  for (const member of mockLeaderboardMembers) {
    const userId = users.get(member.name);
    if (!userId) continue;
    const week = member.points.week;
    const restOfMonth = member.points.maand - week;
    const older = member.points.altijd - member.points.maand;
    const restDate = new Date(Math.min(daysAgo(8).getTime(), Math.max(monthStart.getTime() + 3600_000, daysAgo(20).getTime())));
    const slices: [number, Date, string][] = [
      [older, daysAgo(45), "ouder"],
      [restOfMonth, restDate, "maand"],
      [week, daysAgo(1), "week"],
    ];
    for (const [amount, createdAt, refId] of slices) {
      if (amount > 0) pointDocs.push({ userId, orgId: org._id, amount, reason: "start", refId, label: "Eerdere activiteit", createdAt });
    }
  }
  await PointEvent.insertMany(pointDocs);

  // Activiteit: elke dag van de huidige streak, plus wat losse dagen daarvoor.
  const activityDocs: Record<string, unknown>[] = [];
  for (const member of mockLeaderboardMembers) {
    const userId = users.get(member.name);
    if (!userId) continue;
    const random = seeded(member.name);
    const days = new Set<number>();
    for (let d = 0; d < member.streak; d++) days.add(d);
    for (let d = member.streak + 1; d < 60; d++) if (random() < 0.45) days.add(d);
    for (const d of days) {
      activityDocs.push({ userId, orgId: org._id, date: dayKey(daysAgo(d)), minutes: 10 + Math.round(random() * 30) });
    }
  }
  await ActivityDay.insertMany(activityDocs);

  // Badges van Sanne zoals op het dashboard; collega's met een lange streak of certificaat krijgen er ook wat.
  await UserBadge.insertMany(mockBadges.filter((b) => b.earned).map((b, i) => ({ userId: sanne, code: b.code, earnedAt: daysAgo(40 - i * 8) })));
  for (const member of mockLeaderboardMembers) {
    const userId = users.get(member.name);
    if (!userId || userId.equals(sanne)) continue;
    const codes = ["01", "P1", ...(member.streak >= 7 ? ["7D"] : []), ...(member.streak >= 30 ? ["30D"] : [])];
    await UserBadge.insertMany(codes.map((code) => ({ userId, code, earnedAt: daysAgo(90) })));
  }

  // Toewijzingen (mock-id's koppelen we via de naam).
  const nameById = new Map(mockMembers.map((m) => [m.id, m.name]));
  for (const a of mockAssignments) {
    await Assignment.create({
      orgId: org._id,
      pathSlug: a.pathSlug,
      teamIds: a.target.kind === "team" ? a.target.teams.map((t) => teams[t]._id) : [],
      userIds: a.target.kind === "people" ? a.memberIds.map((id) => users.get(nameById.get(id) ?? "")).filter((id): id is Types.ObjectId => Boolean(id)) : [],
      deadline: new Date(a.deadline),
      required: a.required,
      message: a.message,
      createdBy: idOf("Lotte Meijer"),
      createdAt: new Date(a.createdAt),
    });
  }

  // Meldingen voor Sanne.
  await Notification.insertMany(
    mockNotifications.map((n) => ({
      userId: sanne,
      orgId: org._id,
      type: n.type,
      title: n.title,
      body: n.body,
      href: n.href,
      createdAt: new Date(now.getTime() - n.minutesAgo * 60_000),
      readAt: n.read ? now : undefined,
    })),
  );

  // Openstaande uitnodigingen, plus de tokens waarmee de uitnodigingspagina te demonstreren is.
  const inviteBase = { orgId: org._id, invitedBy: idOf("Lisa de Jong"), paths: ["ai-101"], deadline: addDays(now, 45) };
  await Invite.insertMany([
    { ...inviteBase, token: "demo", email: "nieuw@studionoord.nl", teamId: teams.Design._id, role: "learner", expiresAt: addDays(now, 14) },
    { ...inviteBase, token: "verlopen", email: "verlopen@studionoord.nl", teamId: teams.Design._id, role: "learner", expiresAt: daysAgo(14) },
    { ...inviteBase, token: "gebruikt", email: "sanne@studionoord.nl", teamId: teams.Design._id, role: "learner", expiresAt: addDays(now, 14), acceptedAt: daysAgo(60) },
    { ...inviteBase, token: randomBytes(16).toString("hex"), email: "thijs@studionoord.nl", teamId: teams.Design._id, invitedBy: idOf("Lotte Meijer"), role: "learner", expiresAt: addDays(now, 9), createdAt: daysAgo(5) },
    { ...inviteBase, token: randomBytes(16).toString("hex"), email: "maud@studionoord.nl", teamId: teams.Strategie._id, invitedBy: idOf("Esra Demir"), role: "learner", expiresAt: addDays(now, 12), createdAt: daysAgo(2) },
  ]);

  // Auditlog.
  await AuditLog.insertMany(
    mockAuditLog.map((entry) => ({
      orgId: org._id,
      actorId: users.get(entry.actor),
      actorName: entry.actor,
      action: entry.action,
      target: entry.target,
      meta: { category: entry.category },
      createdAt: new Date(entry.at),
    })),
  );

  return { users: users.size, progress: progressDocs.length };
}

// Tweede organisatie: mag nooit zichtbaar zijn voor Studio Noord.
async function seedOtherOrg() {
  const org = await Organization.create({ name: "Bureau Zuid", slug: "bureau-zuid", initials: "BZ", seats: 5, domains: [{ domain: "bureauzuid.nl", verified: true }] });
  const team = await Team.create({ orgId: org._id, name: "Algemeen" });
  const user = await User.create({
    email: "jan@bureauzuid.nl",
    firstName: "Jan",
    lastName: "Zuidema",
    orgId: org._id,
    teamId: team._id,
    role: "admin",
    onboarding: { completedAt: daysAgo(10) },
  });
  await PointEvent.create({ userId: user._id, orgId: org._id, amount: 9999, reason: "start", refId: "ouder", createdAt: daysAgo(2) });
}

async function main() {
  await connectDb();
  console.info(`Database: ${mongoose.connection.name}`);
  await reset();
  const stats = await seedStudioNoord();
  await seedOtherOrg();
  console.info(`✓ Studio Noord: ${stats.users} gebruikers, ${stats.progress} afgeronde taken`);
  console.info("✓ Bureau Zuid: 1 gebruiker (voor de afschermingstest)");
  console.info("\nInloggen (DEMO_LOGIN=true): sanne@studionoord.nl (beheerder), lotte@studionoord.nl (teammanager), tim@studionoord.nl (cursist)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectDb);
