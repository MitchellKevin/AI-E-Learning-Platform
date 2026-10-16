"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Award, Compass, RotateCcw, Timer } from "lucide-react";
import type { ExamQuestion } from "@/lib/data/exam";
import { TopicIcon } from "@/components/topic-icon";
import { Alert, ArrowButton, Badge, Breadcrumbs, Button, Card, Section, Stat, StatGroup } from "@/components/kit";
import { formatDuration } from "./exam-logic";
import { ExamReview } from "./exam-review";
import { ScoreRing } from "./score-ring";
import type { ExamFlowProps, FinishedAttempt } from "./exam-flow";
import styles from "./exam-result.module.scss";

type Props = ExamFlowProps & {
  attempt: FinishedAttempt;
  questions: ExamQuestion[];
  attemptsLeft: number;
  demo: boolean;
  onRetry: () => void;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function ExamResultView({
  path,
  topics,
  chapters,
  exam,
  certificateHref,
  hasSpecialisations,
  attempt,
  questions,
  attemptsLeft,
  demo,
  onRetry,
}: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { score, passed, results } = attempt;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const count = (status: string) => results.filter((r) => r.status === status).length;
  const correct = count("correct");
  const partial = count("partial");
  const unanswered = count("unanswered");
  const wrong = count("wrong") + unanswered;
  const duration = formatDuration(attempt.durationMs);

  // Score per onderwerp, in de volgorde van het leerpad.
  // In een demo stuurt de server alleen de score, geen uitwerking per vraag.
  const perTopic = demo ? [] : topics
    .map((topic) => {
      const items = questions.map((q, i) => ({ q, r: results[i] })).filter((x) => x.q.topicId === topic.id);
      const points = items.reduce((sum, x) => sum + x.r.points, 0);
      return { topic, total: items.length, points, percent: items.length ? Math.round((points / items.length) * 100) : 0 };
    })
    .filter((t) => t.total > 0);

  // Hoofdstukken om te herhalen: waar een vraag niet (helemaal) goed ging.
  const revisit = new Map<string, { slug: string; topicId: string; misses: number }>();
  questions.forEach((q, i) => {
    if (demo || results[i]?.status === "correct") return;
    const entry = revisit.get(q.chapterSlug) ?? { slug: q.chapterSlug, topicId: q.topicId, misses: 0 };
    entry.misses += 1;
    revisit.set(q.chapterSlug, entry);
  });
  const revisitList = [...revisit.values()]
    .filter((x) => chapters[x.slug])
    .sort((a, b) => a.slug.localeCompare(b.slug, "nl", { numeric: true }));

  return (
    <main>
      <section className={clsx(styles.hero, passed ? styles.heroPassed : styles.heroFailed)}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <Breadcrumbs
              items={[
                { label: "Leerpaden", href: "/leerpaden" },
                { label: path.title, href: `/leerpaden/${path.slug}` },
                { label: "Eindtoets" },
              ]}
            />
            <div className={styles.badges}>
              <Badge variant={passed ? "success" : "warning"} dot>
                {passed ? "Geslaagd" : "Niet geslaagd"}
              </Badge>
              <Badge>
                Poging {attempt.number} van {exam.maxAttempts}
              </Badge>
              {demo && <Badge variant="brand">Demo</Badge>}
            </div>
            <h1 ref={heading} tabIndex={-1} className={styles.title}>
              {passed ? "Gefeliciteerd, je bent geslaagd!" : "Nog net niet geslaagd"}
            </h1>
            <p className={styles.lead}>
              {passed ? (
                <>
                  Je haalde {score}% op de eindtoets {path.title}.{" "}
                  {demo
                    ? "Dit was een demo, dus er is geen nieuw certificaat aangemaakt."
                    : "Je certificaat staat klaar in je profiel en je kunt het meteen delen."}
                </>
              ) : (
                  <>
                    Je haalde {score}%, de slaaggrens is {exam.passingScore}%.{" "}
                    {attemptsLeft > 0
                      ? `Je hebt nog ${plural(attemptsLeft, "poging", "pogingen")}. Herhaal eerst de hoofdstukken hieronder, dan lukt het de volgende keer.`
                      : "Je hebt al je pogingen gebruikt."}
                  </>
                )}
              </p>

              <div className={styles.actions}>
                {passed ? (
                  <>
                    <ArrowButton href={certificateHref}>Bekijk je certificaat</ArrowButton>
                    {hasSpecialisations && (
                      <Button href="/leerpaden/kies" variant="secondary" size="lg" icon={<Compass />}>
                        Kies je specialisatie
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {attemptsLeft > 0 && (
                      <Button size="lg" icon={<RotateCcw />} onClick={onRetry}>
                        Opnieuw proberen
                      </Button>
                    )}
                    <Button href={`/leerpaden/${path.slug}`} variant="secondary" size="lg" icon={<ArrowLeft />}>
                      Terug naar het leerpad
                    </Button>
                  </>
                )}
              </div>
              {!passed && attemptsLeft > 0 && (
                <p className={styles.actionNote}>
                  Nog {attemptsLeft} van {exam.maxAttempts} pogingen over · je krijgt andere vragen
                </p>
              )}
            </div>

            <div className={styles.scoreWrap}>
              <ScoreRing score={score} passingScore={exam.passingScore} passed={passed} />
              {passed && (
                <span className={styles.medal} aria-hidden>
                  <Award />
                </span>
              )}
            </div>
          </div>
        </section>

        <div className={styles.grid}>
          <div className={styles.main}>
            {attempt.timedOut && (
              <Alert variant="info" icon={<Timer />} title="De tijd was om">
                Je toets is na {exam.timeLimitMinutes} minuten automatisch ingeleverd. Niet-beantwoorde vragen tellen
                als fout.
              </Alert>
            )}

            {!passed && attemptsLeft === 0 && (
              <Alert variant="danger" title="Je hebt al je pogingen gebruikt">
                Vraag je teamleider om een extra poging, of lees in het <Link href="/help">helpcentrum</Link> hoe
                herkansen werkt.
              </Alert>
            )}

            {revisitList.length > 0 && (
              <Card className={clsx(styles.tips, !passed && styles.tipsFailed)}>
                <h2 className={styles.cardTitle}>{passed ? "Nog even opfrissen?" : "Dit kun je het beste herhalen"}</h2>
                <p className={styles.cardText}>
                  {passed
                    ? "Je bent geslaagd, maar bij deze hoofdstukken ging nog iets mis."
                    : "Bij deze hoofdstukken ging het mis. Lees ze nog eens door en doe de oefeningen opnieuw."}
                </p>
                <ul className={styles.tipList}>
                  {revisitList.map((item) => {
                    const chapter = chapters[item.slug];
                    const topic = topics.find((t) => t.id === item.topicId);
                    return (
                      <li key={item.slug}>
                        <Link href={`/leerpaden/${path.slug}/${item.slug}`} className={styles.tip}>
                          {topic && (
                            <span className={styles.tipIcon} aria-hidden>
                              <TopicIcon name={topic.icon} strokeWidth={1.75} />
                            </span>
                          )}
                          <span className={styles.tipText}>
                            <span className={styles.tipTitle}>
                              {chapter.number} {chapter.title}
                            </span>
                            <span className={styles.tipMeta}>
                              {topic?.title} · {plural(item.misses, "vraag", "vragen")} niet goed
                            </span>
                          </span>
                          <ArrowRight className={styles.tipArrow} aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {demo ? (
              <Alert variant="info" title="Uitwerking alleen bij de echte toets">
                In de demo zie je alleen je score. Welke antwoorden goed waren, met uitleg, zie je na een echte poging.
              </Alert>
            ) : (
            <Section
              title="Je antwoorden"
              description="Bekijk per vraag het juiste antwoord en de uitleg."
              className={styles.reviewSection}
            >
              <ExamReview
                pathSlug={path.slug}
                questions={questions}
                results={results}
                answers={attempt.answers}
                chapters={chapters}
              />
            </Section>
          )}
        </div>

        {!demo && (
          <aside className={styles.aside}>
            <StatGroup columns={2} className={styles.stats}>
              <Stat value={correct} label="Goed" />
              <Stat value={partial} label="Deels goed" />
              <Stat value={wrong} label="Fout" hint={unanswered ? `waarvan ${unanswered} leeg` : undefined} />
              <Stat value={duration.clock} label="Tijd" hint={`van max. ${exam.timeLimitMinutes}:00`} />
            </StatGroup>

            <Card className={styles.sideCard}>
              <h2 className={styles.cardTitle}>Score per onderwerp</h2>
              <ul className={styles.topics}>
                {perTopic.map((t, i) => {
                  const ok = t.percent >= exam.passingScore;
                  return (
                    <li key={t.topic.id} className={styles.topic}>
                      <div className={styles.topicHead}>
                        <span className={styles.topicTitle}>{t.topic.title}</span>
                        <span className={clsx(styles.topicScore, ok ? styles.ok : styles.low)}>{t.percent}%</span>
                      </div>
                      <div
                        className={styles.topicBar}
                        role="progressbar"
                        aria-label={t.topic.title}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={t.percent}
                        aria-valuetext={`${t.percent}%, ${formatPoints(t.points)} van ${t.total} goed`}
                      >
                        <span
                          className={clsx(styles.topicFill, ok ? styles.ok : styles.low)}
                          style={{ width: `${t.percent}%`, animationDelay: `${300 + i * 60}ms` }}
                        />
                      </div>
                      <span className={styles.topicMeta}>
                        {formatPoints(t.points)} van {t.total} goed
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </aside>
        )}
      </div>
    </main>
  );
}

const formatPoints = (n: number) => n.toLocaleString("nl-NL", { maximumFractionDigits: 1 });
