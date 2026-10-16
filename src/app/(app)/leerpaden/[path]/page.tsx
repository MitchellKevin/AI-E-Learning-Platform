import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, Award, Check, ChevronDown, Lock } from "lucide-react";
import {
  allChapters,
  chapterStatus,
  completedTaskCount,
  getLearningPath,
  getLearningPaths,
  isChapterDone,
  pathProgress,
  topicProgress,
} from "@/lib/content";
import { getProgress } from "@/lib/user-data";
import { getExamOverview } from "@/lib/data/exam-attempts";
import { ArrowButton, Breadcrumbs, Card, ProgressBar, Tag, Tags } from "@/components/ui";
import { TopicIcon } from "@/components/topic-icon";
import styles from "./page.module.scss";

export async function generateStaticParams() {
  return (await getLearningPaths()).map((p) => ({ path: p.slug }));
}

const statusLabel = { done: "Voltooid", active: "Bezig", todo: "Nog niet gestart" } as const;

export default async function LearningPathPage({ params }: { params: Promise<{ path: string }> }) {
  const { path: slug } = await params;
  const [path, paths, progress, exam] = await Promise.all([
    getLearningPath(slug),
    getLearningPaths(),
    getProgress(),
    getExamOverview(slug),
  ]);
  if (!path) notFound();

  const p = pathProgress(progress, path);
  const specialisations = paths.filter((x) => x.prerequisite === path.slug);
  const prerequisite = paths.find((x) => x.slug === path.prerequisite);

  // Eindtoets: het toetshoofdstuk zelf telt niet mee als voorwaarde.
  const required = exam ? allChapters(path).filter((c) => c.slug !== exam.chapterSlug) : [];
  const chaptersLeft = required.filter((c) => !isChapterDone(progress, c)).length;
  const examStatus = !exam ? null : exam.passed ? "passed" : chaptersLeft === 0 ? "open" : "locked";

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <Breadcrumbs items={[{ label: "Leerpaden", href: "/leerpaden" }, { label: path.title }]} />
            <h1 className={styles.title}>{path.title}</h1>
            <p className={styles.lead}>{path.description}</p>
            <Tags>
              <Tag variant="brand">{path.level}</Tag>
              <Tag>{path.topics.length} onderwerpen</Tag>
              <Tag>{p.total} hoofdstukken</Tag>
              <Tag>Circa {path.hours} uur</Tag>
            </Tags>
          </div>
          <Card className={styles.progressCard}>
            <div className={styles.progressHead}>
              <span>Jouw voortgang</span>
              <span className={styles.percent}>{p.percent}%</span>
            </div>
            <ProgressBar value={p.percent} className={styles.progressBar} />
            <p className={styles.progressText}>
              {p.done} van {p.total} hoofdstukken afgerond
            </p>
            {p.current && (
              <ArrowButton href={`/leerpaden/${path.slug}/${p.current.slug}`}>
                {p.started ? `Verder met ${p.current.number}` : "Start leerpad"}
              </ArrowButton>
            )}
          </Card>
        </div>
      </section>

      <div className={styles.grid}>
        <section>
          <h2 className={styles.sectionTitle}>Onderwerpen</h2>
          <div className={styles.topics}>
            {path.topics.map((topic) => {
              const tp = topicProgress(progress, topic);
              return (
                <details key={topic.id} open={tp.status === "active"} className={styles.topic}>
                  <summary className={styles.summary}>
                    <span className={clsx(styles.topicIcon, styles[tp.status])}>
                      <TopicIcon name={topic.icon} strokeWidth={1.75} />
                    </span>
                    <div className={styles.topicText}>
                      <h3 className={styles.topicTitle}>{topic.title}</h3>
                      <p className={styles.topicMeta}>
                        {tp.total} hoofdstukken · {tp.done} afgerond
                      </p>
                    </div>
                    <div className={styles.topicStatus}>
                      <span className={clsx(styles.statusLabel, tp.status !== "todo" && styles.highlight)}>
                        {statusLabel[tp.status]}
                      </span>
                      <ProgressBar value={(tp.done / tp.total) * 100} />
                    </div>
                    <ChevronDown className={styles.chevron} />
                  </summary>
                  <ol className={styles.chapters}>
                    {topic.chapters.map((chapter) => {
                      const status = chapterStatus(progress, chapter);
                      return (
                        <li key={chapter.slug}>
                          <Link href={`/leerpaden/${path.slug}/${chapter.slug}`} className={styles.chapter}>
                            <span className={clsx(styles.check, styles[status])}>
                              {status === "done" && <Check strokeWidth={3} />}
                            </span>
                            <span className={clsx(styles.chapterTitle, styles[status])}>
                              {chapter.number} {chapter.shortTitle}
                            </span>
                            <span className={styles.chapterMeta}>
                              {status === "done"
                                ? "Afgerond"
                                : status === "active"
                                  ? `Bezig · ${completedTaskCount(progress, chapter)} van ${chapter.tasks.length} taken`
                                  : chapter.minutes}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </details>
              );
            })}
          </div>
        </section>

        <aside className={styles.aside}>
          <Card className={styles.sideCard}>
            <h2 className={styles.sectionTitle}>Jouw route</h2>
            {specialisations.length > 0 ? (
              <>
                <div className={styles.routeCurrent}>
                  <span>{path.title}</span>
                  <span>{p.started ? "Nu bezig" : "Start hier"}</span>
                </div>
                <div className={styles.routeLine} />
                <p className={styles.routeLabel}>Daarna kies je</p>
                <div className={styles.routeLine} />
                <div className={styles.routeOptions}>
                  {specialisations.map((s) => (
                    <Link key={s.slug} href={`/leerpaden/${s.slug}`} className={styles.routeOption}>
                      <strong>{s.title}</strong>
                      <span>{s.topics.length} onderwerpen</span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              prerequisite && (
                <p className={styles.sideText}>
                  Dit pad volgt op <Link href={`/leerpaden/${prerequisite.slug}`}>{prerequisite.title}</Link>.
                  Rond dat eerst af om te starten.
                </p>
              )
            )}
          </Card>

          <Card className={styles.sideCard}>
            <h2 className={styles.sectionTitle}>Wat je leert</h2>
            <ul className={styles.goals}>
              {path.learningGoals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </Card>

          <div className={clsx(styles.certificate, examStatus === "passed" && styles.certificateDone)}>
            <div className={styles.certificateHead}>
              <h2 className={styles.sectionTitle}>Certificaat</h2>
              {examStatus && (
                <span className={clsx(styles.examStatus, styles[examStatus])}>
                  {examStatus === "passed" ? <Award aria-hidden /> : examStatus === "locked" && <Lock aria-hidden />}
                  {examStatus === "passed" ? "Behaald" : examStatus === "open" ? "Toets open" : "Vergrendeld"}
                </span>
              )}
            </div>
            <p className={styles.sideText}>
              {examStatus === "passed"
                ? `Je bent geslaagd voor de eindtoets en hebt je ${path.title}-certificaat behaald.`
                : `Rond alle ${required.length || p.total} hoofdstukken af en haal minimaal ${exam?.passingScore ?? 80}% op de eindtoets om je ${path.title}-certificaat te ontvangen.`}
            </p>
            {exam && (
              <>
                <ul className={styles.examFacts}>
                  <li>{exam.questionCount} vragen</li>
                  <li>± {exam.estimatedMinutes} min</li>
                  <li>
                    {exam.attemptsUsed > 0
                      ? `${exam.attemptsUsed} van ${exam.maxAttempts} pogingen`
                      : `${exam.maxAttempts} pogingen`}
                  </li>
                </ul>
                {examStatus === "locked" && (
                  <p className={styles.examLocked}>
                    Nog {chaptersLeft} {chaptersLeft === 1 ? "hoofdstuk" : "hoofdstukken"} tot de eindtoets
                  </p>
                )}
                <Link
                  href={examStatus === "passed" ? `/profiel/certificaten/${path.slug}` : `/leerpaden/${path.slug}/toets`}
                  className={styles.examLink}
                >
                  {examStatus === "passed"
                    ? "Bekijk je certificaat"
                    : examStatus === "open"
                      ? "Naar de eindtoets"
                      : "Bekijk de eindtoets"}
                  <ArrowRight aria-hidden />
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
