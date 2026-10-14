import { getLearningPath, isChapterDone, pathProgress } from "@/lib/content";
import { getBadges, getCertificates, getCurrentUser, getProgress, getStats } from "@/lib/user-data";
import { mockActivity, mockBadgeCatalog, mockProfile, mockSettings } from "@/lib/mock/profile";

// Profiel, badges, activiteit en instellingen. Nu op mock-data; later uit MongoDB.

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

export async function getProfile() {
  return mockProfile;
}

// Alle badges, ook de nog niet behaalde. "Behaald" volgt de bestaande badgedata, zodat het dashboard klopt.
export async function getBadgeCatalog(): Promise<ProfileBadge[]> {
  const [{ badges }, stats, progress, ai101] = await Promise.all([
    getBadges(),
    getStats(),
    getProgress(),
    getLearningPath("ai-101"),
  ]);

  // Voortgang die we uit de echte data kunnen afleiden; de rest staat in de mock.
  const derived: Record<string, ProfileBadge["progress"]> = {
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

  return mockBadgeCatalog.map((badge) => {
    const known = badges.find((b) => b.code === badge.code);
    const earned = known?.earned ?? Boolean(badge.earnedAt);
    const progress = badge.progress && (derived[badge.code] ?? badge.progress);
    return { ...badge, earned, progress: earned ? undefined : progress };
  });
}

export async function getActivity(limit?: number): Promise<Activity[]> {
  const sorted = [...mockActivity].sort((a, b) => b.at.localeCompare(a.at));
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getSettings(): Promise<Settings> {
  return mockSettings;
}

// Publieke verificatie op certificaatnummer. Later een losse query op MongoDB, los van de ingelogde gebruiker.
export async function verifyCertificate(number: string) {
  const normalized = number.trim().toUpperCase();
  const certificate = (await getCertificates()).find((c) => c.number.toUpperCase() === normalized);
  if (!certificate) return undefined;
  const [holder, path] = await Promise.all([getCurrentUser(), getLearningPath(certificate.pathSlug)]);
  if (!path) return undefined;
  return { certificate, holder, path };
}

export async function getCertificateNumbers() {
  return (await getCertificates()).map((c) => c.number);
}

// Alles wat we over de gebruiker bewaren, voor "Download mijn gegevens". Later samengesteld uit MongoDB.
export async function getDataExport() {
  const [user, profile, settings, stats, progress, badges, certificates, activity] = await Promise.all([
    getCurrentUser(),
    getProfile(),
    getSettings(),
    getStats(),
    getProgress(),
    getBadgeCatalog(),
    getCertificates(),
    getActivity(),
  ]);
  const slug = `${user.firstName}-${user.lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    fileName: `ai-academy-gegevens-${slug}.json`,
    data: {
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
