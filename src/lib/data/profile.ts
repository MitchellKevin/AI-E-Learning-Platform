import { getLearningPath, getLearningPaths, isChapterDone, pathProgress } from "@/lib/content";
import { getCertificates, getCurrentUser, getProgress, getStats } from "@/lib/user-data";
import { connectDb } from "@/server/db";
import { ActivityDay, Certificate, PointEvent, UserBadge, fullName, type PointReason } from "@/server/models";
import { getUserContext, requireUser } from "@/server/session";
import { badgeCatalog } from "@/server/services/badges";
import { longestStreak } from "@/server/services/streak";

// Profiel, badges, activiteit en instellingen van de ingelogde gebruiker, uit MongoDB.

export type ProfileDetails = {
  jobTitle: string;
  team: string;
  organisation: string;
  email: string;
  /** Inloggen loopt via de identity provider van de organisatie. */
  loginProvider: string;
  memberSince: string;
  longestStreak: number;
};

export type ProfileBadge = {
  code: string;
  label: string;
  /** Hoe je de badge verdient. */
  description: string;
  earned: boolean;
  earnedAt?: string;
  /** Voortgang richting een nog niet behaalde badge. */
  progress?: { current: number; target: number; unit?: string };
};

export type ActivityType = "chapter" | "quiz" | "badge" | "practice" | "certificate";

export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  at: string;
  points?: number;
  href?: string;
};

export type WeekGoal = 60 | 120 | 180;
export type Focus = "design" | "development" | "beide";
export type Locale = "nl" | "en";

export type AccountSettings = { firstName: string; lastName: string; jobTitle: string };
export type LearningSettings = { weekGoal: WeekGoal; focus: Focus; dailyReminder: boolean; reminderTime: string };

export type NotificationType = "reminders" | "streak" | "deadlines" | "certificates" | "productUpdates";
export type NotificationChannels = { email: boolean; inApp: boolean };
export type NotificationSettings = Record<NotificationType, NotificationChannels>;

export type PrivacySettings = { showOnLeaderboard: boolean; visibleToTeam: boolean };
export type LanguageSettings = { locale: Locale };

export type Settings = {
  account: AccountSettings;
  learning: LearningSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  language: LanguageSettings;
};

export async function getProfile(): Promise<ProfileDetails> {
  const { user, org, team } = await getUserContext();
  const days = await ActivityDay.find({ userId: user._id }, { date: 1 }).lean();
  return {
    jobTitle: user.jobTitle ?? "",
    team: team?.name ?? "",
    organisation: org.name,
    email: user.email,
    loginProvider: user.loginProvider ?? "E-mail",
    memberSince: user.createdAt.toISOString(),
    longestStreak: longestStreak(days.map((d) => d.date)),
  };
}

// Alle badges, ook de nog niet behaalde, met voortgang richting de volgende.
export async function getBadgeCatalog(): Promise<ProfileBadge[]> {
  const user = await requireUser();
  await connectDb();
  const [earned, stats, progress, ai101] = await Promise.all([
    UserBadge.find({ userId: user._id }).lean(),
    getStats(),
    getProgress(),
    getLearningPath("ai-101"),
  ]);
  const earnedAt = new Map(earned.map((b) => [b.code, b.earnedAt.toISOString()]));

  const derived: Record<string, ProfileBadge["progress"]> = {
    "7D": { current: stats.streak, target: 7, unit: "dagen" },
    "30D": { current: stats.streak, target: 30, unit: "dagen" },
    "5K": { current: stats.points, target: 5000, unit: "punten" },
  };
  if (ai101) {
    const p = pathProgress(progress, ai101);
    derived["101"] = { current: p.done, target: p.total, unit: "hoofdstukken" };
    const ethics = ai101.topics.find((t) => t.id === "ethiek");
    if (ethics) {
      const done = ethics.chapters.filter((c) => isChapterDone(progress, c)).length;
      derived.ETH = { current: done, target: ethics.chapters.length, unit: "hoofdstukken" };
    }
  }

  return badgeCatalog.map(({ earnedAt: _seedDate, progress: seedProgress, ...badge }) => {
    void _seedDate;
    const at = earnedAt.get(badge.code);
    return {
      ...badge,
      earned: Boolean(at),
      earnedAt: at,
      progress: at ? undefined : (derived[badge.code] ?? seedProgress),
    };
  });
}

const activityType: Record<string, ActivityType | undefined> = {
  hoofdstuk: "chapter",
  quiz: "quiz",
  oefening: "practice",
  certificaat: "certificate",
};

// Tijdlijn: punten-events (hoofdstukken, quizzen, oefeningen, certificaten) en behaalde badges.
export async function getActivity(limit = 20): Promise<Activity[]> {
  const user = await requireUser();
  await connectDb();
  const [events, badges, paths] = await Promise.all([
    PointEvent.find({ userId: user._id, reason: { $in: Object.keys(activityType) as PointReason[] } }).sort({ createdAt: -1 }).limit(limit).lean(),
    UserBadge.find({ userId: user._id }).sort({ earnedAt: -1 }).limit(limit).lean(),
    getLearningPaths(),
  ]);
  const chapters = new Map(paths.flatMap((p) => p.topics.flatMap((t) => t.chapters.map((c) => [c.id, { path: p, chapter: c }] as const))));

  const items: Activity[] = events.map((e) => {
    const type = activityType[e.reason]!;
    const found = type === "chapter" || type === "quiz" ? chapters.get(e.refId.split("/").slice(0, 2).join("/")) : undefined;
    return {
      id: String(e._id),
      type,
      title: e.label ?? "Punten verdiend",
      detail: found?.chapter.title,
      at: e.createdAt.toISOString(),
      points: e.amount,
      href: found ? `/leerpaden/${found.path.slug}/${found.chapter.slug}` : type === "practice" ? `/oefenen/${e.refId}` : undefined,
    };
  });
  for (const b of badges) {
    const badge = badgeCatalog.find((c) => c.code === b.code);
    items.push({ id: String(b._id), type: "badge", title: `Badge behaald: ${badge?.label ?? b.code}`, detail: badge?.description, at: b.earnedAt.toISOString(), href: "/profiel" });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export async function getSettings(): Promise<Settings> {
  const user = await requireUser();
  const s = user.settings;
  const channel = (c?: { email?: boolean | null; inApp?: boolean | null } | null) => ({ email: Boolean(c?.email), inApp: c?.inApp !== false });
  return {
    account: { firstName: user.firstName, lastName: user.lastName, jobTitle: user.jobTitle ?? "" },
    learning: {
      weekGoal: (s?.learning?.weekGoal ?? 120) as WeekGoal,
      focus: (s?.learning?.focus ?? "beide") as Focus,
      dailyReminder: s?.learning?.dailyReminder !== false,
      reminderTime: s?.learning?.reminderTime ?? "09:00",
    },
    notifications: {
      reminders: channel(s?.notifications?.reminders),
      streak: channel(s?.notifications?.streak),
      deadlines: channel(s?.notifications?.deadlines),
      certificates: channel(s?.notifications?.certificates),
      productUpdates: channel(s?.notifications?.productUpdates),
    },
    privacy: {
      showOnLeaderboard: s?.privacy?.showOnLeaderboard !== false,
      visibleToTeam: s?.privacy?.visibleToTeam !== false,
    },
    language: { locale: (s?.language?.locale ?? "nl") as Locale },
  };
}

// Publieke verificatie op certificaatnummer: los van wie er is ingelogd.
export async function verifyCertificate(number: string) {
  await connectDb();
  const doc = await Certificate.findOne({ number: number.trim().toUpperCase() }).lean();
  if (!doc) return undefined;
  const path = await getLearningPath(doc.pathSlug);
  if (!path) return undefined;
  const [firstName, ...rest] = doc.holderName.split(" ");
  return {
    certificate: { number: doc.number, pathSlug: doc.pathSlug, issuedAt: doc.issuedAt.toISOString(), score: doc.score },
    holder: { id: String(doc.userId), firstName, lastName: rest.join(" "), initials: `${firstName[0] ?? ""}${rest.at(-1)?.[0] ?? ""}`.toUpperCase() },
    path,
  };
}

export async function getCertificateNumbers() {
  return (await getCertificates()).map((c) => c.number);
}

// Alles wat we over de gebruiker bewaren, voor "Download mijn gegevens" (AVG, recht op inzage).
export async function getDataExport() {
  const [user, profile, settings, stats, progress, badges, certificates, activity] = await Promise.all([
    getCurrentUser(),
    getProfile(),
    getSettings(),
    getStats(),
    getProgress(),
    getBadgeCatalog(),
    getCertificates(),
    getActivity(500),
  ]);
  const slug = fullName(user).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    fileName: `ai-academy-gegevens-${slug}.json`,
    data: {
      exportedAt: new Date().toISOString(),
      account: { ...user, ...profile },
      settings,
      stats: { points: stats.points, streak: stats.streak, teamRank: stats.teamRank },
      progress: progress.completedTasks,
      badges: badges.filter((b) => b.earned).map(({ code, label, earnedAt }) => ({ code, label, earnedAt })),
      certificates,
      activity,
    },
  };
}
