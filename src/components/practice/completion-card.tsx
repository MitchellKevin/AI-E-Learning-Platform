import type { Ref } from "react";
import { Check } from "lucide-react";
import { ArrowButton, Button } from "@/components/kit";
import styles from "./completion-card.module.scss";

type Props = {
  score: number;
  /** Verdiende punten; 0 als de oefening al eerder was afgerond. */
  points: number;
  /** Beste score van een eerdere afronding. */
  previousBest?: number;
  next?: { slug: string; title: string };
  headingRef?: Ref<HTMLHeadingElement>;
};

// Succesmelding na "Rond oefening af".
export function CompletionCard({ score, points, previousBest, next, headingRef }: Props) {
  const repeat = previousBest !== undefined;
  const text = !repeat
    ? `Er zijn ${points} punten bij je totaal opgeteld. Je kunt hieronder blijven oefenen met deze opdracht.`
    : score > previousBest
      ? `Je vorige beste score was ${previousBest}. Punten krijg je één keer per oefening, maar je nieuwe record staat op je profiel.`
      : `Je beste score blijft ${previousBest}. Punten krijg je één keer per oefening.`;

  return (
    <section className={styles.card} aria-labelledby="completion-title">
      <span className={styles.badge} aria-hidden>
        <Check strokeWidth={3} />
      </span>
      <div className={styles.body}>
        <p className={styles.eyebrow}>{repeat ? "Opnieuw afgerond" : `Oefening afgerond · +${points} punten`}</p>
        <h2 id="completion-title" ref={headingRef} tabIndex={-1} className={styles.title}>
          Goed gedaan, je prompt scoort {score}
        </h2>
        <p className={styles.text}>{text}</p>
        <div className={styles.actions}>
          {next && <ArrowButton href={`/oefenen/${next.slug}`}>Volgende oefening</ArrowButton>}
          <Button href="/oefenen" variant="secondary">
            Alle oefeningen
          </Button>
        </div>
        {next && <p className={styles.next}>Hierna: {next.title}</p>}
      </div>
    </section>
  );
}
