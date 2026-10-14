import { useId, type ReactNode, type Ref } from "react";
import clsx from "clsx";
import { Check, Lightbulb } from "lucide-react";
import { criteria, type PromptReview } from "./review-prompt";
import styles from "./prompt-feedback.module.scss";

type Props = {
  review: PromptReview;
  /** Review van de vorige poging, voor de verschillen per onderdeel. */
  previous?: PromptReview;
  /** Minimale score om af te ronden; leeg in de vrije oefenruimte. */
  passScore?: number;
  /** Afrondknop of melding onder de score. */
  footer?: ReactNode;
  /** Op de kop, zodat de focus ernaartoe kan na het afronden van een antwoord. */
  headingRef?: Ref<HTMLHeadingElement>;
};

const level = (score: number) => (score >= 70 ? "good" : score >= 40 ? "fair" : "weak");

function Delta({ value, label }: { value: number; label: string }) {
  if (value === 0) return null;
  return (
    <span className={clsx(styles.delta, value > 0 ? styles.up : styles.down)}>
      {value > 0 ? `+${value}` : `−${Math.abs(value)}`}
      <span className="visually-hidden"> {label}</span>
    </span>
  );
}

// "Feedback op je prompt": totaalscore, een balk per onderdeel en een concrete tip.
export function PromptFeedback({ review, previous, passScore, footer, headingRef }: Props) {
  const titleId = `feedback${useId().replace(/:/g, "")}`;
  const passed = passScore !== undefined && review.score >= passScore;

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <div className={styles.head}>
        <div>
          <h3 id={titleId} ref={headingRef} tabIndex={-1} className={styles.title}>
            Feedback op je prompt
          </h3>
          <p className={styles.summary}>{review.summary}</p>
        </div>
        <div className={styles.total}>
          <p className={clsx(styles.score, styles[level(review.score)])}>
            {review.score}
            <span className={styles.outOf}>/100</span>
          </p>
          {previous && <Delta value={review.score - previous.score} label="punten t.o.v. vorige poging" />}
        </div>
      </div>

      {passScore !== undefined && (
        <div className={styles.norm}>
          <div className={styles.normTrack} aria-hidden>
            <div className={clsx(styles.normFill, passed && styles.passed)} style={{ width: `${review.score}%` }} />
            <span className={styles.normMarker} style={{ left: `${passScore}%` }} />
          </div>
          <p className={styles.normText}>
            {passed ? "Je haalt de norm van " : "Afronden kan vanaf een score van "}
            <strong>{passScore}</strong>
            {passed ? "." : `. Nog ${passScore - review.score} punten te gaan.`}
          </p>
        </div>
      )}

      <ul className={styles.list}>
        {review.criteria.map((c, i) => {
          const meta = criteria.find((x) => x.key === c.key);
          const before = previous?.criteria.find((x) => x.key === c.key);
          const state = level(c.score);
          return (
            <li key={c.key} className={styles.item} style={{ "--i": i } as React.CSSProperties}>
              <div className={styles.row}>
                <p className={styles.label}>
                  {c.label}
                  {meta && <span className={styles.description}>{meta.description}</span>}
                </p>
                <p className={styles.itemScore}>
                  {before && <Delta value={c.score - before.score} label="t.o.v. vorige poging" />}
                  <span>
                    {c.score}
                    <span className="visually-hidden"> van 100</span>
                  </span>
                </p>
              </div>
              <div className={styles.track} aria-hidden>
                <div className={clsx(styles.fill, styles[state])} style={{ width: `${c.score}%` }} />
              </div>
              <p className={clsx(styles.tip, state === "good" && styles.tipGood)}>
                {state === "good" ? <Check aria-hidden /> : <Lightbulb aria-hidden />}
                <span>{c.tip}</span>
              </p>
            </li>
          );
        })}
      </ul>

      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}
