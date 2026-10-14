import type { Metadata } from "next";
import { MessageSquareText, PenLine, TrendingUp } from "lucide-react";
import { ArrowButton, Card, PageHeader, ProgressBar } from "@/components/kit";
import { ExerciseBrowser } from "@/components/practice/exercise-browser";
import { FreePracticeCard } from "@/components/practice/free-practice-card";
import { getExercises, getFreePractice, getPracticeProgress } from "@/lib/data/practice";
import { formatNumber } from "@/lib/format";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Oefenen · AI Academy" };

const steps = [
  { icon: <PenLine />, title: "Schrijf je prompt", text: "Werk een echte opdracht uit, met het materiaal erbij." },
  { icon: <MessageSquareText />, title: "Bekijk het antwoord", text: "Zie direct wat de AI met je prompt doet." },
  { icon: <TrendingUp />, title: "Verbeter met feedback", text: "Je krijgt een score op vijf onderdelen en concrete tips." },
];

export default async function PracticePage() {
  const [exercises, free, progress] = await Promise.all([getExercises(), getFreePractice(), getPracticeProgress()]);

  const done = exercises.filter((e) => e.slug in progress.completed);
  const earned = done.reduce((sum, e) => sum + e.points, 0);
  const scores = Object.values(progress.completed);
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const next = exercises.find((e) => !(e.slug in progress.completed));
  const percent = exercises.length ? (done.length / exercises.length) * 100 : 0;

  return (
    <main>
      <PageHeader
        band
        size="lg"
        eyebrow="Oefenen"
        title="Oefen prompten op echte opdrachten"
        lead="Schrijf een prompt, zie meteen wat de AI ermee doet en krijg feedback op vijf onderdelen. Zo merk je binnen tien minuten wat werkt en wat niet."
        actions={
          <Card className={styles.progressCard}>
            <div className={styles.progressHead}>
              <span>Jouw oefeningen</span>
              <span className={styles.progressValue}>
                {done.length}
                <span className={styles.progressTotal}>/{exercises.length}</span>
              </span>
            </div>
            <ProgressBar value={percent} className={styles.progressBar} />
            <p className={styles.progressText}>
              {done.length > 0
                ? `${formatNumber(earned)} punten verdiend · gemiddelde score ${average}`
                : "Nog geen oefeningen afgerond"}
            </p>
            {next && <ArrowButton href={`/oefenen/${next.slug}`}>{done.length ? "Volgende oefening" : "Start met oefenen"}</ArrowButton>}
          </Card>
        }
      />

      <div className={styles.content}>
        <div className={styles.intro}>
          <Card className={styles.steps}>
            <h2 className={styles.stepsTitle}>Zo werkt het</h2>
            <ol className={styles.stepList}>
              {steps.map((step, i) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepIcon} aria-hidden>
                    {step.icon}
                  </span>
                  <div>
                    <p className={styles.stepTitle}>
                      <span className="visually-hidden">Stap {i + 1}: </span>
                      {step.title}
                    </p>
                    <p className={styles.stepText}>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <div className={styles.free}>
            <FreePracticeCard exercise={free} />
          </div>
        </div>

        <ExerciseBrowser exercises={exercises} completed={progress.completed} />
      </div>
    </main>
  );
}
