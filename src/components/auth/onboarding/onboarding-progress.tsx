"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import styles from "./onboarding-progress.module.scss";

export type OnboardingProgressProps = {
  steps: { id: string; label: string }[];
  /** Index van de huidige stap; gelijk aan steps.length als alles klaar is. */
  current: number;
  /** Teruggaan naar een afgeronde stap; zonder deze prop zijn de stappen niet klikbaar. */
  onSelect?: (index: number) => void;
};

// Voortgang van de intake: één balkje per stap, afgeronde stappen zijn klikbaar.
export function OnboardingProgress({ steps, current, onSelect }: OnboardingProgressProps) {
  const done = current >= steps.length;
  const percentage = Math.round((Math.min(current, steps.length) / steps.length) * 100);

  return (
    <nav aria-label="Voortgang intake" className={styles.progress}>
      <div className={styles.meta}>
        <p className={styles.count}>
          {done ? (
            <>
              <Check aria-hidden className={styles.doneIcon} />
              Intake afgerond
            </>
          ) : (
            <>
              Stap <span className={styles.number}>{current + 1}</span> van {steps.length}
              <span className={styles.currentLabel}> · {steps[current]?.label}</span>
            </>
          )}
        </p>
        <p className={styles.percentage} aria-hidden>
          {percentage}%
        </p>
      </div>

      <ol className={styles.steps}>
        {steps.map((step, index) => {
          const state = index < current ? "done" : index === current ? "active" : "todo";
          const content = (
            <>
              <span className={styles.bar} aria-hidden />
              <span className={styles.label}>
                {step.label}
                {state === "done" && <span className="visually-hidden"> (afgerond)</span>}
              </span>
            </>
          );
          return (
            <li
              key={step.id}
              className={clsx(styles.step, styles[state])}
              aria-current={state === "active" ? "step" : undefined}
            >
              {state === "done" && onSelect ? (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => onSelect(index)}
                  aria-label={`Terug naar stap ${index + 1}: ${step.label}`}
                >
                  {content}
                </button>
              ) : (
                <span className={styles.static}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
