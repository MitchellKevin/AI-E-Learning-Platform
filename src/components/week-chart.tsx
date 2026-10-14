import clsx from "clsx";
import styles from "./week-chart.module.scss";

const days = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export function WeekChart({ minutes, goal }: { minutes: (number | null)[]; goal: number }) {
  const max = Math.max(...minutes.map((m) => m ?? 0), 1);
  const best = minutes.indexOf(max);
  const total = minutes.reduce<number>((sum, m) => sum + (m ?? 0), 0);
  const remaining = Math.max(goal - total, 0);

  return (
    <figure>
      <div className={clsx(styles.row, styles.bars)}>
        {minutes.map((m, i) => (
          <div key={days[i]} className={styles.column} style={{ "--i": i } as React.CSSProperties}>
            <span className={styles.value}>{m ? `${m} min` : "–"}</span>
            <div
              className={clsx(styles.bar, i === best && styles.best, !m && styles.empty)}
              style={{ height: m ? `${(m / max) * 96}px` : "3px" }}
            />
          </div>
        ))}
      </div>
      <div className={clsx(styles.row, styles.days)}>
        {days.map((d) => (
          <span key={d} className={styles.day}>
            {d}
          </span>
        ))}
      </div>
      <figcaption className={styles.caption}>
        Minuten per dag. Je weekdoel is {goal} minuten
        {remaining > 0 ? `, nog ${remaining} te gaan.` : ". Behaald!"}
      </figcaption>
    </figure>
  );
}
