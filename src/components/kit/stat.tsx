import clsx from "clsx";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import styles from "./stat.module.scss";

export type StatTrend = {
  /** Tekst, bv. "+12%" of "+3 deze week". */
  value: ReactNode;
  direction: "up" | "down" | "flat";
  /** Is deze richting goed nieuws? Bepaalt groen of rood (standaard: omhoog = goed). */
  positive?: boolean;
  /** Voor screenreaders en als toelichting, bv. "t.o.v. vorige maand". */
  label?: ReactNode;
};

export type StatProps = {
  value: ReactNode;
  label: ReactNode;
  /** Waarde in merkblauw, zoals de streak op het dashboard. */
  accent?: boolean;
  /** Kleine toelichting onder het label. */
  hint?: ReactNode;
  trend?: StatTrend;
  size?: "md" | "lg";
  className?: string;
};

export function Stat({ value, label, accent, hint, trend, size = "md", className }: StatProps) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const good = trend ? (trend.positive ?? trend.direction !== "down") : false;

  return (
    <div className={clsx(styles.stat, styles[size], className)}>
      <p className={clsx(styles.value, accent && styles.accent)}>{value}</p>
      <p className={styles.label}>{label}</p>
      {trend && (
        <p
          className={clsx(
            styles.trend,
            trend.direction === "flat" ? styles.flat : good ? styles.good : styles.bad,
          )}
        >
          <TrendIcon aria-hidden />
          <span>{trend.value}</span>
          {trend.label && <span className={styles.trendLabel}>{trend.label}</span>}
        </p>
      )}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

export type StatGroupProps = {
  /** Kolommen vanaf tablet; op mobiel twee. */
  columns?: 2 | 3 | 4;
  className?: string;
  children: ReactNode;
};

// Kaart met statistieken naast elkaar, gescheiden door lijnen (zoals op het dashboard).
export function StatGroup({ columns = 4, className, children }: StatGroupProps) {
  return <div className={clsx(styles.group, styles[`columns${columns}`], className)}>{children}</div>;
}
