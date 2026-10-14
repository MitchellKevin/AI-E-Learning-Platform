import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allChapters, getLearningPath, getLearningPaths, isChapterDone, topicProgress } from "@/lib/content";
import { getCertificates, getProgress } from "@/lib/user-data";
import { getExam, getExamAttempts, getExams } from "@/lib/data/exam";
import { ExamFlow, type ExamRequirement } from "@/components/exam/exam-flow";

export async function generateStaticParams() {
  return (await getExams()).map((e) => ({ path: e.pathSlug }));
}

export async function generateMetadata({ params }: { params: Promise<{ path: string }> }): Promise<Metadata> {
  const path = await getLearningPath((await params).path);
  return { title: path ? `Eindtoets ${path.title} · AI Academy` : "Eindtoets · AI Academy" };
}

export default async function ExamPage({ params }: { params: Promise<{ path: string }> }) {
  const { path: slug } = await params;
  const [path, paths, exam, attempts, progress, certificates] = await Promise.all([
    getLearningPath(slug),
    getLearningPaths(),
    getExam(slug),
    getExamAttempts(slug),
    getProgress(),
    getCertificates(),
  ]);
  if (!path || !exam) notFound();

  // Het toetshoofdstuk zelf telt niet mee als voorwaarde.
  const required = allChapters(path).filter((c) => c.slug !== exam.chapterSlug);
  const done = required.filter((c) => isChapterDone(progress, c)).length;
  const next = required.find((c) => !isChapterDone(progress, c));

  const requirement: ExamRequirement = {
    locked: done < required.length,
    done,
    total: required.length,
    topics: path.topics.map((t) => {
      const chapters = t.chapters.filter((c) => c.slug !== exam.chapterSlug);
      const tp = topicProgress(progress, { ...t, chapters });
      return { id: t.id, title: t.title, done: tp.done, total: tp.total };
    }),
    continueHref: next ? `/leerpaden/${path.slug}/${next.slug}` : undefined,
    continueLabel: next ? `Verder met ${next.number}` : undefined,
  };

  const chapters = Object.fromEntries(
    allChapters(path).map((c) => [c.slug, { number: c.number, title: c.shortTitle }]),
  );

  // Na het slagen bestaat het certificaat; tot die tijd naar het overzicht.
  const certificateHref = certificates.some((c) => c.pathSlug === slug)
    ? `/profiel/certificaten/${slug}`
    : "/profiel/certificaten";

  return (
    <ExamFlow
      path={{ slug: path.slug, title: path.title, level: path.level }}
      topics={path.topics.map((t) => ({ id: t.id, title: t.title, icon: t.icon }))}
      chapters={chapters}
      exam={exam}
      initialAttempts={attempts}
      requirement={requirement}
      certificateHref={certificateHref}
      hasSpecialisations={paths.some((p) => p.prerequisite === path.slug)}
    />
  );
}
