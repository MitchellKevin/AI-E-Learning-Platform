import Link from "next/link";
import { Award, BookOpen, CircleCheck, Flame, Sparkles } from "lucide-react";
import type { PointRule } from "@/lib/data/leaderboard";
import styles from "./point-rules.module.scss";

const icons: Record<PointRule["id"], React.ReactNode> = {
  hoofdstuk: <BookOpen />,
  oefening: <Sparkles />,
  quiz: <CircleCheck />,
  streak: <Flame />,
  certificaat: <Award />,
};

// Uitleg hoe je punten verdient, rechts naast de ranglijst.
export function PointRules({ rules }: { rules: PointRule[] }) {
  return (
    <section className={styles.card} aria-labelledby="point-rules-title">
      <h2 id="point-rules-title" className={styles.title}>
        Hoe verdien je punten?
      </h2>
      <ul className={styles.list}>
        {rules.map((rule) => (
          <li key={rule.id} className={styles.rule}>
            <span className={styles.icon} aria-hidden>
              {icons[rule.id]}
            </span>
            <span className={styles.text}>
              <span className={styles.label}>{rule.label}</span>
              <span className={styles.description}>{rule.description}</span>
            </span>
            <span className={styles.points}>
              {rule.points}
              <span className="sr-only"> punten</span>
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.foot}>
        Snel punten pakken? Probeer een opdracht in{" "}
        <Link href="/oefenen" className={styles.link}>
          Oefenen
        </Link>
        .
      </p>
    </section>
  );
}
