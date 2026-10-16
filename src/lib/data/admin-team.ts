import { allChapters, getLearningPaths } from "@/lib/content";
import { cache } from "react";
import { connectDb } from "@/server/db";
import { requireRole } from "@/server/session";
import { loadAdminSource } from "@/server/services/admin-team";
import { addDays, daysBetween, formatMonth, formatShortDate } from "@/components/admin/shell/format";
import { expectedProgress, summarizeAssignment, byStatusThenDeadline } from "@/components/admin/shell/assignments";

// Beheerdata (teamleads), berekend uit MongoDB (zie server/services/admin-team.ts).

// Types

export type TeamName = string;

export type PathSlug = "ai-101" | "ui-ux-design" | "software-development";

export type MockMemberPath = {
  slug: PathSlug;
  progress: number; // 0–100
  completedAt?: string;
  examScore?: number;
};

export type MockMember = {
  id: string;
  name: string;
  initials: string;
  email: string;
  team: TeamName;
  role: string;
  lastActiveAt: string | null; // null = uitnodiging nog niet geaccepteerd
  invitedAt?: string;
  minutesPerWeek: number;
  points: number;
  streak: number;
  paths: MockMemberPath[];
};

export type MockAssignment = {
  id: string;
  pathSlug: PathSlug;
  target: { kind: "team"; teams: TeamName[] } | { kind: "people" };
  memberIds: string[];
  createdAt: string;
  deadline: string;
  required: boolean;
  message?: string;
};

export type MockExamAttempt = { memberId: string; pathSlug: PathSlug; date: string; score: number };
export type WeeklyActivity = { week: number; start: string; minutes: number; activeLearners: number };
export type MonthlyHours = { month: string; hours: number };

export type ReportPeriod = "30d" | "90d" | "12m";
type Compare = { current: number; previous: number };
export type PeriodSummary = { completedChapters: Compare; activeLearners: Compare; hours: Compare };

export type PathState = "afgerond" | "bezig" | "niet-gestart";
export type MemberStatus = "actief" | "achter" | "inactief" | "uitgenodigd";

export type MemberPath = MockMemberPath & {
  title: string;
  state: PathState;
  deadline?: string;
  required?: boolean;
  /** Verwachte voortgang op basis van de looptijd van de toewijzing. */
  expected?: number;
  atRisk: boolean;
};

export type MemberCertificate = { number: string; pathTitle: string; issuedAt: string; score: number };

export type ActivityItem = {
  id: string;
  date: string;
  kind: "chapter" | "exam" | "certificate" | "invite";
  label: string;
  detail?: string;
};

export type TeamMember = Omit<MockMember, "paths"> & {
  paths: MemberPath[];
  /** Het pad waar iemand nu mee bezig is (of als laatste afrondde). */
  currentPath: MemberPath;
  status: MemberStatus;
  daysInactive: number | null;
  certificates: MemberCertificate[];
  activity: ActivityItem[];
};

export type AdminPath = { slug: PathSlug; title: string; shortDescription: string; hours: number; chapters: number };

export type AssignmentStatus = "op-schema" | "risico" | "verlopen" | "afgerond";

export type Assignment = MockAssignment & {
  pathTitle: string;
  targetLabel: string;
  members: { id: string; name: string; initials: string }[];
  completedCount: number;
  progress: number;
  expected: number;
  daysLeft: number;
  status: AssignmentStatus;
};

export type AttentionItem = {
  member: Pick<TeamMember, "id" | "name" | "initials" | "team" | "email">;
  kind: "inactief" | "achter" | "uitnodiging";
  title: string;
  detail: string;
};

// Helpers

const RISK_MARGIN = 20; // procentpunten achter op de verwachte voortgang
const INACTIVE_AFTER = 14; // dagen

const certificateCode: Record<PathSlug, string> = { "ai-101": "101", "ui-ux-design": "UX", "software-development": "SD" };

function certificateNumber(memberId: string, slug: PathSlug, issuedAt: string) {
  const hash = [...`${memberId}${slug}`].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 9000, 7);
  return `AIA-${certificateCode[slug]}-${issuedAt.slice(0, 4)}-${String(hash + 1000).padStart(4, "0")}`;
}

const pathState = (progress: number): PathState =>
  progress >= 100 ? "afgerond" : progress > 0 ? "bezig" : "niet-gestart";

async function pathIndex() {
  const paths = await getLearningPaths();
  return new Map(paths.map((p) => [p.slug as PathSlug, p]));
}

// Accessors. Alleen voor teammanagers en beheerders, altijd binnen de eigen organisatie.

const source = cache(async () => {
  const user = await requireRole("manager");
  await connectDb();
  return loadAdminSource(user.orgId);
});

export async function getReferenceDate() {
  return (await source()).today;
}

export async function getTeamNames(): Promise<TeamName[]> {
  return (await source()).teams;
}

export async function getOrganization() {
  const { organization, members } = await source();
  return { ...organization, seatsUsed: members.length };
}

export async function getAdminPaths(): Promise<AdminPath[]> {
  const paths = await getLearningPaths();
  return paths.map((p) => ({
    slug: p.slug as PathSlug,
    title: p.title,
    shortDescription: p.shortDescription,
    hours: p.hours,
    chapters: allChapters(p).length,
  }));
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { today, members: sourceMembers, assignments: sourceAssignments, examAttempts } = await source();
  const paths = await pathIndex();

  return sourceMembers.map((m) => {
    const invited = m.lastActiveAt === null;
    const daysInactive = m.lastActiveAt ? daysBetween(m.lastActiveAt, today) : null;

    const memberPaths: MemberPath[] = m.paths.map((p) => {
      const title = paths.get(p.slug)?.title ?? p.slug;
      const state = pathState(p.progress);
      // Openstaande toewijzing met de vroegste deadline bepaalt het schema.
      const assignment = sourceAssignments
        .filter((a) => a.pathSlug === p.slug && a.memberIds.includes(m.id) && a.deadline >= today)
        .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
      const expected = assignment ? expectedProgress(assignment.createdAt, assignment.deadline, today) : undefined;
      const atRisk = !invited && state !== "afgerond" && expected !== undefined && p.progress < expected - RISK_MARGIN;
      return { ...p, title, state, deadline: assignment?.deadline, required: assignment?.required, expected, atRisk };
    });

    const currentPath = memberPaths.find((p) => p.state !== "afgerond") ?? memberPaths[memberPaths.length - 1];
    const status: MemberStatus = invited
      ? "uitgenodigd"
      : daysInactive! > INACTIVE_AFTER
        ? "inactief"
        : memberPaths.some((p) => p.atRisk)
          ? "achter"
          : "actief";

    const certificates: MemberCertificate[] = memberPaths
      .filter((p) => p.completedAt && p.examScore !== undefined)
      .map((p) => ({
        number: certificateNumber(m.id, p.slug, p.completedAt!),
        pathTitle: p.title,
        issuedAt: p.completedAt!,
        score: p.examScore!,
      }));

    return {
      ...m,
      paths: memberPaths,
      currentPath,
      status,
      daysInactive,
      certificates,
      activity: buildActivity(m, memberPaths, paths, examAttempts, today),
    };
  });
}

// Recente activiteit, afgeleid uit voortgang en toetsen. Komt straks uit een event-log.
function buildActivity(
  m: MockMember,
  memberPaths: MemberPath[],
  paths: Awaited<ReturnType<typeof pathIndex>>,
  sourceAttempts: MockExamAttempt[],
  referenceDate: string,
): ActivityItem[] {
  if (!m.lastActiveAt) {
    return [
      {
        id: "invite",
        date: m.invitedAt ?? referenceDate,
        kind: "invite",
        label: "Uitgenodigd voor AI Academy",
        detail: "Wacht nog op acceptatie",
      },
    ];
  }

  const items: ActivityItem[] = [];

  for (const attempt of sourceAttempts.filter((a) => a.memberId === m.id)) {
    const title = paths.get(attempt.pathSlug)?.title ?? attempt.pathSlug;
    const passed = attempt.score >= 70;
    items.push({
      id: `exam-${attempt.pathSlug}-${attempt.date}`,
      date: attempt.date,
      kind: passed ? "certificate" : "exam",
      label: passed ? `Certificaat ${title} behaald` : `Eindtoets ${title} niet gehaald`,
      detail: `Score ${attempt.score}%`,
    });
  }

  // Laatst afgeronde hoofdstukken van het huidige pad, teruggerekend vanaf de laatste activiteit.
  const current = memberPaths.find((p) => p.state === "bezig");
  const path = current && paths.get(current.slug);
  if (current && path) {
    const chapters = allChapters(path);
    const done = Math.round((current.progress / 100) * chapters.length);
    const gap = m.minutesPerWeek >= 60 ? 2 : 4;
    chapters
      .slice(Math.max(0, done - 3), done)
      .reverse()
      .forEach((chapter, i) => {
        items.push({
          id: `chapter-${chapter.id}`,
          date: addDays(m.lastActiveAt!, -i * gap),
          kind: "chapter",
          label: `Hoofdstuk ${chapter.number} afgerond`,
          detail: `${chapter.shortTitle} · ${path.title}`,
        });
      });
  }

  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
}

export async function getAssignments(): Promise<Assignment[]> {
  const [{ today, assignments: sourceAssignments }, members, paths] = await Promise.all([source(), getTeamMembers(), pathIndex()]);
  const byId = new Map(members.map((m) => [m.id, m]));

  return sourceAssignments
    .map((a) => {
      const assigned = a.memberIds.map((id) => byId.get(id)).filter((m): m is TeamMember => Boolean(m));
      const progressOf = (id: string) => byId.get(id)?.paths.find((p) => p.slug === a.pathSlug)?.progress ?? 0;
      return summarizeAssignment(a, assigned, progressOf, paths.get(a.pathSlug)?.title ?? a.pathSlug, today);
    })
    .sort(byStatusThenDeadline);
}

export async function getOverview() {
  const { today, weekly: weeklyActivity } = await source();
  const [members, assignments, paths, org] = await Promise.all([
    getTeamMembers(),
    getAssignments(),
    getAdminPaths(),
    getOrganization(),
  ]);

  const joined = members.filter((m) => m.status !== "uitgenodigd");
  const active = joined.filter((m) => m.status !== "inactief");
  const ai = members.map((m) => m.paths.find((p) => p.slug === "ai-101")).filter((p): p is MemberPath => Boolean(p));
  const certificates = members.flatMap((m) => m.certificates);
  const monthAgo = addDays(today, -30);

  const kpis = {
    activeLearners: active.length,
    joinedLearners: joined.length,
    aiProgress: Math.round(ai.reduce((s, p) => s + p.progress, 0) / Math.max(ai.length, 1)),
    aiCompleted: ai.filter((p) => p.state === "afgerond").length,
    aiAssigned: ai.length,
    certificates: certificates.length,
    certificatesLastMonth: certificates.filter((c) => c.issuedAt > monthAgo).length,
    minutesPerWeek: Math.round(active.reduce((s, m) => s + m.minutesPerWeek, 0) / Math.max(active.length, 1)),
    seatsUsed: org.seatsUsed,
    seats: org.seats,
    invited: members.length - joined.length,
  };

  const pathBreakdown = paths
    .map((path) => {
      const entries = members.flatMap((m) => m.paths.filter((p) => p.slug === path.slug));
      return {
        slug: path.slug,
        title: path.title,
        total: entries.length,
        afgerond: entries.filter((p) => p.state === "afgerond").length,
        bezig: entries.filter((p) => p.state === "bezig").length,
        nietGestart: entries.filter((p) => p.state === "niet-gestart").length,
      };
    })
    .filter((p) => p.total > 0);

  const weekly = weeklyActivity.slice(-8);

  const attention: AttentionItem[] = [];
  for (const m of members) {
    const member = { id: m.id, name: m.name, initials: m.initials, team: m.team, email: m.email };
    const path = m.currentPath;
    const deadline = path.deadline ? ` · deadline ${formatShortDate(path.deadline)}` : "";
    if (m.status === "inactief") {
      attention.push({
        member,
        kind: "inactief",
        title: `${m.daysInactive} dagen niet actief`,
        detail: `${path.title} · ${path.progress}%${deadline}`,
      });
    } else if (m.status === "achter") {
      const behind = m.paths.find((p) => p.atRisk)!;
      attention.push({
        member,
        kind: "achter",
        title: `Loopt achter op ${behind.title}`,
        detail: `${behind.progress}% van verwacht ${behind.expected}% · deadline ${formatShortDate(behind.deadline!)}`,
      });
    } else if (m.status === "uitgenodigd" && m.invitedAt && daysBetween(m.invitedAt, today) >= 3) {
      attention.push({
        member,
        kind: "uitnodiging",
        title: "Uitnodiging nog niet geaccepteerd",
        detail: `Verstuurd op ${formatShortDate(m.invitedAt)}`,
      });
    }
  }
  // Langst inactief eerst, dan wie achterloopt, dan open uitnodigingen.
  const kindOrder = { inactief: 0, achter: 1, uitnodiging: 2 };
  const inactiveDays = (item: AttentionItem) => members.find((m) => m.id === item.member.id)?.daysInactive ?? 0;
  attention.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || inactiveDays(b) - inactiveDays(a));

  const deadlines = assignments
    .filter((a) => a.status !== "afgerond" && a.daysLeft >= 0)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 4);

  return { today, kpis, pathBreakdown, weekly, attention, deadlines };
}

// Rapportages

export const reportPeriods: { value: ReportPeriod; label: string; description: string }[] = [
  { value: "30d", label: "30 dagen", description: "de laatste 30 dagen" },
  { value: "90d", label: "90 dagen", description: "de laatste 90 dagen" },
  { value: "12m", label: "12 maanden", description: "de laatste 12 maanden" },
];

const periodDays: Record<ReportPeriod, number> = { "30d": 30, "90d": 90, "12m": 365 };

export type ChartPoint = { key: string; label: string; fullLabel: string; value: number };

export type PeriodReport = {
  summary: PeriodSummary & { certificates: Compare; avgScore: { current: number | null; previous: number | null } };
  time: { unit: "week" | "maand"; points: ChartPoint[] };
  certificates: { unit: "week" | "maand"; points: ChartPoint[]; total: number };
  exams: { slug: PathSlug; title: string; attempts: number; passed: number; avgScore: number | null; best: number | null }[];
};

export async function getReports() {
  const [src, members, paths] = await Promise.all([source(), getTeamMembers(), getAdminPaths()]);
  const today = src.today;

  // Stand vandaag: hoe ver zijn de collega's die een pad hebben?
  const funnel = paths
    .map((path) => {
      const entries = members.flatMap((m) => m.paths.filter((p) => p.slug === path.slug));
      return {
        slug: path.slug,
        title: path.title,
        stages: [
          { label: "Toegewezen", count: entries.length },
          { label: "Gestart", count: entries.filter((p) => p.progress > 0).length },
          { label: "Halverwege", count: entries.filter((p) => p.progress >= 50).length },
          { label: "Afgerond met certificaat", count: entries.filter((p) => p.state === "afgerond").length },
        ],
      };
    })
    .filter((p) => p.stages[0].count > 0);

  const byPeriod = Object.fromEntries(
    reportPeriods.map(({ value }) => [value, buildPeriodReport(value, today, paths, src)]),
  ) as Record<ReportPeriod, PeriodReport>;

  return { today, funnel, byPeriod };
}

function buildPeriodReport(
  period: ReportPeriod,
  today: string,
  paths: AdminPath[],
  { examAttempts: sourceAttempts, weekly: weeklyActivity, monthly: monthlyHours, summaries: periodSummaries }: Awaited<ReturnType<typeof source>>,
): PeriodReport {
  const days = periodDays[period];
  const from = addDays(today, -days);
  const previousFrom = addDays(from, -days);
  const inRange = (date: string, start: string, end: string) => date > start && date <= end;

  const attempts = sourceAttempts.filter((a) => inRange(a.date, from, today));
  const previousAttempts = sourceAttempts.filter((a) => inRange(a.date, previousFrom, from));
  const avg = (list: typeof attempts) =>
    list.length ? Math.round(list.reduce((s, a) => s + a.score, 0) / list.length) : null;
  const passed = (list: typeof attempts) => list.filter((a) => a.score >= 70);

  const monthly = period === "12m";
  const weeks = period === "30d" ? weeklyActivity.slice(-5) : weeklyActivity;
  const months = period === "12m" ? monthlyHours : monthlyHours.slice(-4);

  const time: ChartPoint[] = monthly
    ? months.map((m) => ({ key: m.month, label: formatMonth(m.month), fullLabel: formatMonth(m.month, true), value: m.hours }))
    : weeks.map((w) => ({
        key: `w${w.week}`,
        label: `wk ${w.week}`,
        fullLabel: `Week ${w.week} (vanaf ${formatShortDate(w.start)})`,
        value: Math.round((w.minutes / 60) * 10) / 10,
      }));

  // Certificaten per week (30 dagen) of per maand (langere periodes).
  const certBuckets: ChartPoint[] =
    period === "30d"
      ? weeks.map((w) => ({
          key: `w${w.week}`,
          label: `wk ${w.week}`,
          fullLabel: `Week ${w.week} (vanaf ${formatShortDate(w.start)})`,
          value: passed(attempts).filter((a) => inRange(a.date, addDays(w.start, -1), addDays(w.start, 6))).length,
        }))
      : months.map((m) => ({
          key: m.month,
          label: formatMonth(m.month),
          fullLabel: formatMonth(m.month, true),
          value: passed(attempts).filter((a) => a.date.startsWith(m.month)).length,
        }));

  return {
    summary: {
      ...periodSummaries[period],
      certificates: { current: passed(attempts).length, previous: passed(previousAttempts).length },
      avgScore: { current: avg(attempts), previous: avg(previousAttempts) },
    },
    time: { unit: monthly ? "maand" : "week", points: time },
    certificates: { unit: period === "30d" ? "week" : "maand", points: certBuckets, total: passed(attempts).length },
    exams: paths.map((p) => {
      const list = attempts.filter((a) => a.pathSlug === p.slug);
      return {
        slug: p.slug,
        title: p.title,
        attempts: list.length,
        passed: passed(list).length,
        avgScore: avg(list),
        best: list.length ? Math.max(...list.map((a) => a.score)) : null,
      };
    }),
  };
}
