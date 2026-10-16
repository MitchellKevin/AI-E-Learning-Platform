import Link from "next/link";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Badge, Tag, Tags } from "@/components/kit";
import type { PracticeExercise } from "@/lib/data/practice";
import { audienceLabel } from "@/lib/data/practice-shared";
import { PracticeIcon } from "./practice-icon";
import styles from "./exercise-card.module.scss";

type Props = {
  exercise: PracticeExercise;
  /** Beste score als de oefening al is afgerond. */
  completedScore?: number;
};

export function ExerciseCard({ exercise, completedScore }: Props) {
  const done = completedScore !== undefined;

  return (
    <Link href={`/oefenen/${exercise.slug}`} className={clsx(styles.card, done && styles.done)}>
      <div className={styles.top}>
        <span className={styles.icon}>
          <PracticeIcon name={exercise.icon} strokeWidth={1.75} />
        </span>
        {done ? (
          <Badge variant="success" size="sm" icon={<Check strokeWidth={3} />}>
            Afgerond · {completedScore}
          </Badge>
        ) : (
          <span className={styles.audience}>{audienceLabel[exercise.audience]}</span>
        )}
      </div>
      <h3 className={styles.title}>{exercise.title}</h3>
      <p className={styles.summary}>{exercise.summary}</p>
      <Tags>
        <Tag variant="brand">{exercise.level}</Tag>
        <Tag>{exercise.minutes} min</Tag>
        <Tag>+{exercise.points} punten</Tag>
      </Tags>
    </Link>
  );
}
