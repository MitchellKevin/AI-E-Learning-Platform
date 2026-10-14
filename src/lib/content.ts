import { learningPaths } from "./mock-content";
import type { Chapter, LearningPath, Progress, Topic } from "./types";

// Contentlaag. Nu op mock-data; later dezelfde functies op Storyblok laten draaien.

export async function getLearningPaths(): Promise<LearningPath[]> {
  return learningPaths;
}

export async function getLearningPath(slug: string): Promise<LearningPath | undefined> {
  return learningPaths.find((p) => p.slug === slug);
}

export function allChapters(path: LearningPath): Chapter[] {
  return path.topics.flatMap((t) => t.chapters);
}

export async function getChapter(pathSlug: string, chapterSlug: string) {
  const path = await getLearningPath(pathSlug);
  if (!path) return undefined;
  const chapters = allChapters(path);
  const index = chapters.findIndex((c) => c.slug === chapterSlug);
  if (index === -1) return undefined;
  const chapter = chapters[index];
  const topic = path.topics.find((t) => t.chapters.includes(chapter)) as Topic;
  return {
    path,
    topic,
    topicIndex: path.topics.indexOf(topic),
    chapter,
    prev: chapters[index - 1],
    next: chapters[index + 1],
  };
}

// Voortgang afleiden uit afgeronde taken.

export function completedTaskCount(progress: Progress, chapter: Chapter) {
  return progress.completedTasks[chapter.id]?.length ?? 0;
}

export function isChapterDone(progress: Progress, chapter: Chapter) {
  return completedTaskCount(progress, chapter) >= chapter.tasks.length;
}

export type ChapterStatus = "done" | "active" | "todo";

export function chapterStatus(progress: Progress, chapter: Chapter): ChapterStatus {
  if (isChapterDone(progress, chapter)) return "done";
  return completedTaskCount(progress, chapter) > 0 ? "active" : "todo";
}

export function topicProgress(progress: Progress, topic: Topic) {
  const done = topic.chapters.filter((c) => isChapterDone(progress, c)).length;
  const started = topic.chapters.some((c) => completedTaskCount(progress, c) > 0);
  const total = topic.chapters.length;
  const status: ChapterStatus = done === total ? "done" : started ? "active" : "todo";
  return { done, total, status };
}

export function pathProgress(progress: Progress, path: LearningPath) {
  const chapters = allChapters(path);
  const done = chapters.filter((c) => isChapterDone(progress, c)).length;
  const current = chapters.find((c) => !isChapterDone(progress, c));
  return {
    done,
    total: chapters.length,
    percent: Math.round((done / chapters.length) * 100),
    started: chapters.some((c) => completedTaskCount(progress, c) > 0),
    current,
    topicsLeft: path.topics.filter((t) => topicProgress(progress, t).status !== "done").length,
  };
}
