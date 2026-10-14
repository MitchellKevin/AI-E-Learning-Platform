"use client";

import { useId, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown, ClipboardPaste, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/kit";
import type { CriterionKey, PracticeExercise } from "@/lib/data/practice";
import { criteria as allCriteria } from "./review-prompt";
import styles from "./exercise-brief.module.scss";

type Props = {
  exercise: PracticeExercise;
  /** Beste score per onderdeel over alle pogingen. */
  best: Partial<Record<CriterionKey, number>>;
  onInsertMaterial: () => void;
};

// Een checklistpunt is behaald zodra het onderdeel in een van je pogingen goed scoort.
const MET = 70;

// Linkerkolom: de opdracht, het materiaal, de criteria en tips.
export function ExerciseBrief({ exercise, best, onInsertMaterial }: Props) {
  const [showTips, setShowTips] = useState(false);
  const tipsId = useId();
  const free = Boolean(exercise.free);
  const met = exercise.criteria.filter((c) => (best[c.criterion] ?? 0) >= MET).length;

  return (
    <div className={styles.brief}>
      <section className={styles.card} aria-labelledby="brief-title">
        <h2 id="brief-title" className={styles.eyebrow}>
          {free ? "Zo werkt het" : "Opdracht"}
        </h2>
        <div className={styles.context}>
          {exercise.context.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className={styles.goal}>
          <Target aria-hidden />
          <div>
            <p className={styles.goalLabel}>Doel</p>
            <p className={styles.goalText}>{exercise.goal}</p>
          </div>
        </div>
      </section>

      {exercise.material && (
        <section className={styles.card} aria-labelledby="material-title">
          <div className={styles.materialHead}>
            <h2 id="material-title" className={styles.eyebrow}>
              {exercise.material.label}
            </h2>
            <Button variant="ghost" size="sm" icon={<ClipboardPaste />} onClick={onInsertMaterial}>
              Voeg toe aan prompt
            </Button>
          </div>
          <pre className={clsx(styles.material, exercise.material.kind === "code" && styles.code)} tabIndex={0}>
            {exercise.material.body}
          </pre>
        </section>
      )}

      <section className={styles.card} aria-labelledby="criteria-title">
        <div className={styles.criteriaHead}>
          <h2 id="criteria-title" className={styles.eyebrow}>
            {free ? "Waar de feedback op let" : "Criteria"}
          </h2>
          {!free && (
            <span className={styles.count}>
              {met} van {exercise.criteria.length} behaald
            </span>
          )}
        </div>

        {free ? (
          <ul className={styles.criteria}>
            {allCriteria.map((c) => (
              <li key={c.key} className={styles.criterion}>
                <span className={styles.dot} aria-hidden />
                <span>
                  <strong>{c.label}</strong> · {c.description}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <ul className={styles.criteria}>
              {exercise.criteria.map((c) => {
                const done = (best[c.criterion] ?? 0) >= MET;
                return (
                  <li key={c.criterion} className={clsx(styles.criterion, done && styles.done)}>
                    <span className={styles.check} aria-hidden>
                      {done && <Check strokeWidth={3} />}
                    </span>
                    <span>
                      {c.label}
                      <span className="visually-hidden">{done ? " (behaald)" : " (nog niet behaald)"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className={styles.pass}>
              Rond af vanaf een totaalscore van <strong>{exercise.passScore}</strong>. Je verdient dan{" "}
              <strong>{exercise.points} punten</strong>.
            </p>
          </>
        )}
      </section>

      <section className={styles.tipsCard}>
        <h2 className={styles.tipsHeading}>
          <button
            type="button"
            className={styles.tipsToggle}
            aria-expanded={showTips}
            aria-controls={tipsId}
            onClick={() => setShowTips((v) => !v)}
          >
            <Lightbulb aria-hidden className={styles.tipsIcon} />
            <span className={styles.tipsLabel}>{showTips ? "Verberg tips" : `Toon tips (${exercise.tips.length})`}</span>
            <ChevronDown aria-hidden className={clsx(styles.chevron, showTips && styles.open)} />
          </button>
        </h2>
        <ul id={tipsId} hidden={!showTips} className={styles.tips}>
          {exercise.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
