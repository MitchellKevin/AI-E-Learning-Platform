import { notFound } from "next/navigation";
import { allChapters, getChapter, getLearningPaths } from "@/lib/content";
import { getCurrentUser, getProgress } from "@/lib/user-data";
import { getTutorContext } from "@/lib/data/tutor";
import { ChapterView } from "@/components/chapter/chapter-view";
import { TutorProvider } from "@/components/tutor/tutor-provider";

export async function generateStaticParams() {
  const paths = await getLearningPaths();
  return paths.flatMap((path) => allChapters(path).map((c) => ({ path: path.slug, chapter: c.slug })));
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ path: string; chapter: string }>;
}) {
  const { path: pathSlug, chapter: chapterSlug } = await params;
  const [data, progress, user] = await Promise.all([
    getChapter(pathSlug, chapterSlug),
    getProgress(),
    getCurrentUser(),
  ]);
  if (!data) notFound();

  const { path, topic, topicIndex, chapter, prev, next } = data;
  const tutor = await getTutorContext(path, chapter, user.firstName);
  const shortTopic = topic.title.split(" ")[0];
  const link = (slug: string) => `/leerpaden/${path.slug}/${slug}`;

  return (
    // Per hoofdstuk een eigen tutorgesprek.
    <TutorProvider key={chapter.id} context={tutor}>
      <ChapterView
        chapter={chapter}
        initialCompleted={progress.completedTasks[chapter.id] ?? []}
        breadcrumbs={[
          { label: path.title, href: `/leerpaden/${path.slug}` },
          { label: `${topicIndex + 1} · ${shortTopic}`, href: `/leerpaden/${path.slug}` },
          { label: chapter.number },
        ]}
        prev={prev && { href: link(prev.slug), label: `${prev.number} ${prev.shortTitle}` }}
        next={next && { href: link(next.slug), label: `${next.number} ${next.shortTitle}` }}
      />
    </TutorProvider>
  );
}
