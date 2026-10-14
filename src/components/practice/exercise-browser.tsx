"use client";

import { useState } from "react";
import { SearchX } from "lucide-react";
import { Button, EmptyState, Section, SegmentedControl, Select } from "@/components/kit";
import type { Level } from "@/lib/types";
import type { PracticeExercise } from "@/lib/data/practice";
import { ExerciseCard } from "./exercise-card";
import styles from "./exercise-browser.module.scss";

type AudienceFilter = "alle" | "designers" | "developers";
type LevelFilter = "alle" | Level;

const levels: Level[] = ["Beginner", "Gemiddeld", "Gevorderd"];

type Props = {
  exercises: PracticeExercise[];
  completed: Record<string, number>;
};

// Filters op doelgroep en niveau. Oefeningen "voor iedereen" tellen bij beide doelgroepen mee.
export function ExerciseBrowser({ exercises, completed }: Props) {
  const [audience, setAudience] = useState<AudienceFilter>("alle");
  const [level, setLevel] = useState<LevelFilter>("alle");

  const visible = exercises.filter(
    (e) =>
      (audience === "alle" || e.audience === audience || e.audience === "iedereen") &&
      (level === "alle" || e.level === level),
  );
  const filtered = audience !== "alle" || level !== "alle";

  function reset() {
    setAudience("alle");
    setLevel("alle");
  }

  return (
    <Section
      title="Oefeningen"
      description="Korte opdrachten uit het werk van designers en developers. Je krijgt bij elke poging feedback."
      actions={
        <div className={styles.filters}>
          <SegmentedControl<AudienceFilter>
            label="Doelgroep"
            size="sm"
            value={audience}
            onValueChange={setAudience}
            options={[
              { value: "alle", label: "Alle" },
              { value: "designers", label: "Designers" },
              { value: "developers", label: "Developers" },
            ]}
          />
          <Select
            aria-label="Niveau"
            value={level}
            onChange={(e) => setLevel(e.target.value as LevelFilter)}
            className={styles.level}
          >
            <option value="alle">Alle niveaus</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
      }
    >
      <p role="status" className="visually-hidden">
        {visible.length === 1 ? "1 oefening" : `${visible.length} oefeningen`} gevonden
      </p>

      {visible.length > 0 ? (
        // key laat de stagger opnieuw afspelen als de filters veranderen.
        <ul key={`${audience}-${level}`} className={styles.grid}>
          {visible.map((exercise) => (
            <li key={exercise.slug} className={styles.item}>
              <ExerciseCard exercise={exercise} completedScore={completed[exercise.slug]} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<SearchX />}
          title="Geen oefeningen gevonden"
          action={
            filtered && (
              <Button variant="secondary" size="sm" onClick={reset}>
                Wis filters
              </Button>
            )
          }
        >
          Er is nog geen oefening met deze combinatie. Kies een ander niveau of bekijk alle oefeningen.
        </EmptyState>
      )}
    </Section>
  );
}
