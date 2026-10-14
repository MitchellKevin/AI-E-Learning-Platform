import { chapterStatus, getLearningPaths, pathProgress } from "@/lib/content";
import { getProgress } from "@/lib/user-data";
import { audienceLabel, getExercises, getFreePractice } from "@/lib/data/practice";
import { getHelpArticles, getHelpCategories } from "@/lib/data/help";
import { mockAccount, mockNotifications, mockPages } from "@/lib/mock/shell";

// App-shell: account, meldingen en de zoekindex. Nu op mock-data; later Auth.js-sessie + MongoDB.

export type ShellRole = "cursist" | "teammanager" | "beheerder";

export type ShellAccount = {
  email: string;
  team: string;
  organisation: string;
  roles: ShellRole[];
};

export type ShellNotificationType = "streak" | "assignment" | "badge" | "certificate" | "team";

export type ShellNotificationSeed = {
  id: string;
  type: ShellNotificationType;
  title: string;
  body: string;
  href: string;
  minutesAgo: number;
  read: boolean;
};

export type ShellNotification = Omit<ShellNotificationSeed, "minutesAgo"> & {
  /** ISO-tijdstip voor <time dateTime>. */
  at: string;
  /** "2 uur geleden", "Gisteren"… */
  timeLabel: string;
};

export type ShellPage = {
  title: string;
  href: string;
  context?: string;
  keywords?: string;
  roles?: ShellRole[];
};

export type SearchGroup = "pages" | "paths" | "chapters" | "exercises" | "help";

export type SearchItem = {
  id: string;
  group: SearchGroup;
  title: string;
  /** Tweede regel, bv. "AI 101 · 3.3". */
  context?: string;
  href: string;
  /** Extra zoektermen die niet getoond worden. */
  keywords?: string;
  status?: "done" | "active";
};

export type SearchIndex = {
  items: SearchItem[];
  /** Id's die bij een lege zoekopdracht als "Snel naar" verschijnen. */
  suggested: string[];
};

export async function getShellAccount() {
  return mockAccount;
}

export function canManage(account: ShellAccount) {
  return account.roles.includes("teammanager") || account.roles.includes("beheerder");
}

export function relativeTime(minutesAgo: number) {
  if (minutesAgo < 1) return "Zojuist";
  if (minutesAgo < 60) return `${Math.round(minutesAgo)} min geleden`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} uur geleden`;
  if (hours < 48) return "Gisteren";
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} dagen geleden`;
  return new Date(Date.now() - minutesAgo * 60_000).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export async function getNotifications(): Promise<ShellNotification[]> {
  const now = Date.now();
  return [...mockNotifications]
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .map(({ minutesAgo, ...n }) => ({
      ...n,
      at: new Date(now - minutesAgo * 60_000).toISOString(),
      timeLabel: relativeTime(minutesAgo),
    }));
}

// Eén platte index voor het zoekvenster; wordt server-side opgebouwd en als prop doorgegeven.
export async function getSearchIndex(): Promise<SearchIndex> {
  const [paths, progress, exercises, free, articles, categories, account] = await Promise.all([
    getLearningPaths(),
    getProgress(),
    getExercises(),
    getFreePractice(),
    getHelpArticles(),
    getHelpCategories(),
    getShellAccount(),
  ]);

  const pages: SearchItem[] = mockPages
    .filter((p) => !p.roles || p.roles.some((r) => account.roles.includes(r)))
    .map((p) => ({ id: `page:${p.href}`, group: "pages", title: p.title, context: p.context, href: p.href, keywords: p.keywords }));

  const pathItems: SearchItem[] = paths.flatMap((path) => [
    {
      id: `path:${path.slug}`,
      group: "paths",
      title: path.title,
      context: `${path.audience ?? "Voor iedereen"} · ${path.topics.length} onderwerpen`,
      href: `/leerpaden/${path.slug}`,
      keywords: path.shortDescription,
    },
    {
      id: `exam:${path.slug}`,
      group: "paths",
      title: `Eindtoets ${path.title}`,
      context: `${path.title} · Toets`,
      href: `/leerpaden/${path.slug}/toets`,
      keywords: "examen certificaat",
    },
  ]);

  const chapters: SearchItem[] = paths.flatMap((path) =>
    path.topics.flatMap((topic) =>
      topic.chapters.map((chapter) => {
        const status = chapterStatus(progress, chapter);
        return {
          id: `chapter:${chapter.id}`,
          group: "chapters" as const,
          title: chapter.title,
          context: `${path.title} · ${chapter.number}`,
          href: `/leerpaden/${path.slug}/${chapter.slug}`,
          keywords: topic.title,
          status: status === "todo" ? undefined : status,
        };
      }),
    ),
  );

  const exerciseItems: SearchItem[] = [free, ...exercises].map((e) => ({
    id: `exercise:${e.slug}`,
    group: "exercises",
    title: e.title,
    context: e.free ? "Vrije oefenruimte" : `${audienceLabel[e.audience]} · ${e.minutes} min`,
    href: `/oefenen/${e.slug}`,
    keywords: e.summary,
  }));

  const help: SearchItem[] = articles.map((a) => ({
    id: `help:${a.slug}`,
    group: "help",
    title: a.title,
    context: categories.find((c) => c.slug === a.category)?.title,
    href: `/help/${a.slug}`,
    keywords: [a.summary, ...(a.keywords ?? [])].join(" "),
  }));

  // Snel naar: eerst het hoofdstuk waar je gebleven bent.
  const started = paths.find((p) => pathProgress(progress, p).started) ?? paths[0];
  const current = started && pathProgress(progress, started).current;
  const resume = current ? [`chapter:${current.id}`] : [];

  return {
    items: [...pages, ...pathItems, ...chapters, ...exerciseItems, ...help],
    suggested: [...resume, "page:/leerpaden", "page:/oefenen", "page:/leaderboard", "page:/instellingen"],
  };
}
