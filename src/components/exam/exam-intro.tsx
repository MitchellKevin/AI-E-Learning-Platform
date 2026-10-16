"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Award, Check, Flag, ListChecks, Lock, RotateCcw, Sparkles, Timer } from "lucide-react";
import type { ExamAttempt } from "@/lib/data/exam";
import { formatDate } from "@/lib/format";
import { TopicIcon } from "@/components/topic-icon";
import {
  Alert,
  ArrowButton,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  ProgressBar,
  Stat,
  StatGroup,
  StatusPill,
  Switch,
} from "@/components/kit";
import type { ExamFlowProps } from "./exam-flow";
import styles from "./exam-intro.module.scss";

type Props = ExamFlowProps & {
  attempts: ExamAttempt[];
  demo: boolean;
  onDemoChange: (demo: boolean) => void;
  onStart: () => void;
  /** De server zet een poging klaar. */
  starting?: boolean;
  /** Vergrendeld en geen demo. */
  locked: boolean;
  /** Focus op de kop, bv. na "Opnieuw proberen". */
  focusOnMount?: boolean;
};

export function ExamIntro({
  path,
  topics,
  exam,
  requirement,
  certificateHref,
  attempts,
  demo,
  onDemoChange,
  onStart,
  starting = false,
  locked,
  focusOnMount,
}: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const used = attempts.length;
  const passed = attempts.some((a) => a.passed);
  const outOfAttempts = !passed && used >= exam.maxAttempts;
  const canStart = !locked && !passed && !outOfAttempts;
  const attemptLabel = `${Math.min(used + 1, exam.maxAttempts)} van ${exam.maxAttempts}`;

  useEffect(() => {
    if (focusOnMount) heading.current?.focus();
  }, [focusOnMount]);

  const rules = [
    {
      icon: <ListChecks />,
      title: `${exam.questionCount} vragen, één per scherm`,
      text: "Eén antwoord kiezen, alle juiste antwoorden aanvinken of een open vraag in je eigen woorden.",
    },
    {
      icon: <Sparkles />,
      title: "Open vragen beoordeeld door AI",
      text: "De AI beoordeelt je antwoord op vaste criteria en laat per criterium zien wat goed ging.",
    },
    {
      icon: <Flag />,
      title: "Markeer en kom later terug",
      text: "Twijfel je? Markeer de vraag en spring er via het vragenoverzicht naar terug.",
    },
    {
      icon: <Timer />,
      title: `Maximaal ${exam.timeLimitMinutes} minuten`,
      text: "Je ziet de resterende tijd bovenin. Is de tijd om, dan leveren we je toets automatisch in.",
    },
    {
      icon: <RotateCcw />,
      title: `${exam.maxAttempts} pogingen`,
      text: "Elke poging krijgt een andere selectie en volgorde van vragen.",
    },
    {
      icon: <Award />,
      title: `Slaaggrens ${exam.passingScore}%`,
      text: `Geslaagd? Dan staat je certificaat ${path.title} meteen in je profiel.`,
    },
  ];

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <Breadcrumbs
              items={[
                { label: "Leerpaden", href: "/leerpaden" },
                { label: path.title, href: `/leerpaden/${path.slug}` },
                { label: "Eindtoets" },
              ]}
            />
            <h1 ref={heading} tabIndex={-1} className={styles.title}>
              Eindtoets {path.title}
            </h1>
            <p className={styles.lead}>
              Laat zien wat je hebt geleerd. Haal je minimaal {exam.passingScore}%, dan ontvang je je certificaat{" "}
              {path.title}.
            </p>
          </div>
          <StatGroup columns={4} className={styles.facts}>
            <Stat value={exam.questionCount} label="Vragen" />
            <Stat value={`${exam.passingScore}%`} label="Slaaggrens" />
            <Stat value={attemptLabel} label="Poging" />
            <Stat value={`± ${exam.estimatedMinutes} min`} label="Geschatte tijd" />
          </StatGroup>
        </div>
      </section>

      <div className={styles.grid}>
        <div className={styles.main}>
          {requirement.locked && (
            <Card className={styles.lockedCard}>
              <div className={styles.lockedHead}>
                <span className={clsx(styles.lockIcon, demo && styles.unlocked)} aria-hidden>
                  {demo ? <Check /> : <Lock />}
                </span>
                <div>
                  <h2 className={styles.cardTitle}>Nog niet ontgrendeld</h2>
                  <p className={styles.cardText}>
                    De eindtoets komt vrij zodra je alle hoofdstukken van {path.title} hebt afgerond. Je hebt er{" "}
                    <strong>
                      {requirement.done} van {requirement.total}
                    </strong>{" "}
                    af.
                  </p>
                </div>
              </div>
              <ProgressBar value={(requirement.done / requirement.total) * 100} className={styles.lockedBar} />
              <ul className={styles.requirements} aria-label="Voortgang per onderwerp">
                {requirement.topics.map((t) => {
                  const complete = t.done === t.total;
                  return (
                    <li key={t.id} className={styles.requirement}>
                      <span className={clsx(styles.reqCheck, complete && styles.complete)} aria-hidden>
                        {complete && <Check strokeWidth={3} />}
                      </span>
                      <span className={styles.reqTitle}>{t.title}</span>
                      <span className={styles.reqCount}>
                        {t.done}/{t.total}
                        <span className="visually-hidden"> hoofdstukken afgerond</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              {requirement.continueHref && (
                <div className={styles.continue}>
                  <ArrowButton href={requirement.continueHref}>{requirement.continueLabel}</ArrowButton>
                </div>
              )}
              <div className={styles.demo}>
                <Switch
                  label="Toch bekijken (demo)"
                  description="Probeer de toets alvast uit. Je poging wordt niet opgeslagen."
                  checked={demo}
                  onCheckedChange={onDemoChange}
                />
              </div>
            </Card>
          )}

          {passed && (
            <Alert
              variant="success"
              title="Je bent geslaagd voor deze toets"
              action={
                <Button href={certificateHref} size="sm">
                  Bekijk je certificaat
                </Button>
              }
            >
              Je certificaat {path.title} staat in je profiel. Een nieuwe poging is niet nodig.
            </Alert>
          )}

          {outOfAttempts && (
            <Alert variant="danger" title="Je hebt al je pogingen gebruikt">
              Neem contact op met je teamleider om een nieuwe poging aan te vragen, of lees in het{" "}
              <Link href="/help">helpcentrum</Link> hoe herkansen werkt.
            </Alert>
          )}

          <Card className={styles.rulesCard}>
            <div className={styles.rulesHead}>
              <h2 className={styles.cardTitle}>Zo werkt de toets</h2>
              {demo && requirement.locked && (
                <Badge variant="brand" size="sm">
                  Demo
                </Badge>
              )}
            </div>
            <ul className={styles.rules}>
              {rules.map((rule) => (
                <li key={rule.title} className={styles.rule}>
                  <span className={styles.ruleIcon} aria-hidden>
                    {rule.icon}
                  </span>
                  <div>
                    <h3 className={styles.ruleTitle}>{rule.title}</h3>
                    <p className={styles.ruleText}>{rule.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.start}>
              <Button size="lg" iconRight={<ArrowRight />} onClick={onStart} disabled={!canStart} loading={starting}>
                {used > 0 && !passed ? `Start poging ${used + 1}` : "Start de toets"}
              </Button>
              <p className={styles.startNote}>
                {locked
                  ? "Beschikbaar zodra je alle hoofdstukken hebt afgerond."
                  : canStart
                    ? `Neem er rustig ${exam.estimatedMinutes} minuten voor. Pauzeren kan niet.`
                    : passed
                      ? "Je hebt deze toets al gehaald."
                      : "Geen pogingen meer over."}
              </p>
            </div>
          </Card>
        </div>

        <aside className={styles.aside}>
          <Card className={styles.sideCard}>
            <h2 className={styles.cardTitle}>Wat wordt er getoetst</h2>
            <p className={styles.cardText}>Elk onderwerp uit het leerpad komt aan bod.</p>
            <ul className={styles.topics}>
              {topics.map((t) => (
                <li key={t.id} className={styles.topic}>
                  <span className={styles.topicIcon} aria-hidden>
                    <TopicIcon name={t.icon} strokeWidth={1.75} />
                  </span>
                  {t.title}
                </li>
              ))}
            </ul>
          </Card>

          <Card className={styles.sideCard}>
            <h2 className={styles.cardTitle}>Jouw pogingen</h2>
            {attempts.length === 0 ? (
              <p className={styles.cardText}>Je hebt deze toets nog niet gemaakt.</p>
            ) : (
              <ol className={styles.attempts}>
                {attempts.map((a) => (
                  <li key={a.number} className={styles.attempt}>
                    <div>
                      <p className={styles.attemptTitle}>
                        Poging {a.number} · {a.score}%
                      </p>
                      <p className={styles.attemptDate}>{formatDate(a.date)}</p>
                    </div>
                    <StatusPill variant={a.passed ? "success" : "danger"} size="sm">
                      {a.passed ? "Geslaagd" : "Niet geslaagd"}
                    </StatusPill>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </aside>
      </div>
    </main>
  );
}
