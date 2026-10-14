import clsx from "clsx";
import { CountUp } from "@/components/count-up";
import styles from "./score-ring.module.scss";

type Props = {
  score: number;
  passingScore: number;
  passed: boolean;
  size?: number;
};

const STROKE = 10;

// Scorecirkel die zich bij binnenkomst vult, met een streepje op de slaaggrens.
export function ScoreRing({ score, passingScore, passed, size = 168 }: Props) {
  const r = (size - STROKE) / 2 - 6;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div
      role="img"
      aria-label={`Score ${score}%, slaaggrens ${passingScore}%: ${passed ? "geslaagd" : "niet geslaagd"}`}
      className={clsx(styles.ring, passed ? styles.passed : styles.failed)}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
        <circle cx={c} cy={c} r={r} className={styles.track} strokeWidth={STROKE} />
        <circle
          cx={c}
          cy={c}
          r={r}
          className={styles.value}
          strokeWidth={STROKE}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ "--circumference": circumference } as React.CSSProperties}
          transform={`rotate(-90 ${c} ${c})`}
        />
        <line
          x1={c}
          x2={c}
          y1={c - r - STROKE / 2 - 4}
          y2={c - r + STROKE / 2 + 4}
          className={styles.threshold}
          transform={`rotate(${passingScore * 3.6} ${c} ${c})`}
        />
      </svg>
      <div className={styles.center} aria-hidden>
        <span className={styles.score}>
          <CountUp value={score} duration={1100} />
          <span className={styles.percent}>%</span>
        </span>
        <span className={styles.label}>Slaaggrens {passingScore}%</span>
      </div>
    </div>
  );
}
