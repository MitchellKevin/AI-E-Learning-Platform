"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Spinner } from "@/components/kit";
import styles from "./exam-grading.module.scss";

type Props = {
  pathTitle: string;
  hasOpen: boolean;
  onDone: () => void;
};

// Korte tussenstap terwijl de toets wordt nagekeken. Later wacht dit op de echte beoordeling.
export function ExamGrading({ pathTitle, hasOpen, onDone }: Props) {
  const steps = useMemo(
    () => [
      { label: "Antwoorden opslaan", ms: 600 },
      { label: "Meerkeuzevragen nakijken", ms: 700 },
      ...(hasOpen ? [{ label: "Open vragen laten beoordelen door AI", ms: 1400 }] : []),
      { label: "Score berekenen", ms: 500 },
    ],
    [hasOpen],
  );
  const [current, setCurrent] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    if (current >= steps.length) {
      const id = window.setTimeout(() => onDoneRef.current(), 300);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setCurrent((c) => c + 1), steps[current].ms);
    return () => window.clearTimeout(id);
  }, [current, steps]);

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.spinner}>
          <Spinner size={28} decorative />
        </div>
        <p className={styles.eyebrow}>Eindtoets {pathTitle}</p>
        <h1 ref={heading} tabIndex={-1} className={styles.title}>
          Je toets wordt nagekeken
        </h1>
        <p className={styles.lead}>Dit duurt een paar seconden. Sluit dit venster nog niet.</p>

        <ol className={styles.steps}>
          {steps.map((step, i) => {
            const state = i < current ? "done" : i === current ? "active" : "todo";
            return (
              <li key={step.label} className={clsx(styles.step, styles[state])}>
                <span className={styles.stepIcon} aria-hidden>
                  {state === "done" ? <Check strokeWidth={3} /> : state === "active" ? <span /> : null}
                </span>
                {step.label}
                <span className="visually-hidden">
                  {state === "done" ? " (klaar)" : state === "active" ? " (bezig)" : ""}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="visually-hidden" role="status">
          {current < steps.length ? `${steps[current].label}…` : "Klaar. Je resultaat wordt geladen."}
        </p>
      </div>
    </main>
  );
}
