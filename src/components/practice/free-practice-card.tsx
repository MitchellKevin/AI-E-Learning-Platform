import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { PracticeExercise } from "@/lib/data/practice";
import styles from "./free-practice-card.module.scss";

// Uitgelichte kaart naar de vrije oefenruimte (zonder opdracht of score-eis).
export function FreePracticeCard({ exercise }: { exercise: PracticeExercise }) {
  return (
    <Link href={`/oefenen/${exercise.slug}`} className={styles.card}>
      <span className={styles.icon} aria-hidden>
        <Sparkles strokeWidth={1.75} />
      </span>
      <p className={styles.eyebrow}>Zonder opdracht</p>
      <h2 className={styles.title}>{exercise.title}</h2>
      <p className={styles.text}>{exercise.summary} Handig voor een prompt die je deze week echt nodig hebt.</p>
      <span className={styles.cta}>
        Open oefenruimte
        <span className={styles.arrow} aria-hidden>
          <ArrowRight />
        </span>
      </span>
    </Link>
  );
}
