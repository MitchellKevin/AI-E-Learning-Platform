import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Badge, PageHeader, Tag, Tags } from "@/components/kit";
import { Playground } from "@/components/practice/playground";
import {
  audienceLabel,
  getExercise,
  getExercises,
  getFreePractice,
  getNextExercise,
  getPracticeProgress,
} from "@/lib/data/practice";
import styles from "./page.module.scss";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const [exercises, free] = await Promise.all([getExercises(), getFreePractice()]);
  return [...exercises, free].map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const exercise = await getExercise((await params).slug);
  return { title: exercise ? `${exercise.title} · Oefenen · AI Academy` : "Oefening niet gevonden · AI Academy" };
}

export default async function ExercisePage({ params }: Params) {
  const { slug } = await params;
  const exercise = await getExercise(slug);
  if (!exercise) notFound();

  const free = Boolean(exercise.free);
  const [progress, next] = await Promise.all([
    getPracticeProgress(),
    free ? Promise.resolve(undefined) : getNextExercise(slug),
  ]);
  const completedScore = progress.completed[slug];

  return (
    <main>
      <PageHeader
        band
        breadcrumbs={[{ label: "Oefenen", href: "/oefenen" }, { label: exercise.title }]}
        title={exercise.title}
        lead={exercise.summary}
      >
        <Tags>
          {free ? (
            <>
              <Tag variant="brand">Zonder opdracht</Tag>
              <Tag>Feedback bij elke poging</Tag>
            </>
          ) : (
            <>
              <Tag variant="brand">{exercise.level}</Tag>
              <Tag>{audienceLabel[exercise.audience]}</Tag>
              <Tag>{exercise.minutes} min</Tag>
              <Tag>+{exercise.points} punten</Tag>
              {completedScore !== undefined && (
                <Badge variant="success" icon={<Check strokeWidth={3} />}>
                  Afgerond · beste score {completedScore}
                </Badge>
              )}
            </>
          )}
        </Tags>
      </PageHeader>

      <div className={styles.content}>
        <Playground
          exercise={exercise}
          completedScore={completedScore}
          next={next && next.slug !== slug ? { slug: next.slug, title: next.title } : undefined}
        />
      </div>
    </main>
  );
}
