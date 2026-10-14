import clsx from "clsx";
import styles from "./stacked-bar.module.scss";

export type StackTone = "done" | "active" | "todo";

export type StackSegment = { label: string; value: number; tone: StackTone };

type Props = {
  /** Toegankelijke naam, bv. "AI 101: 7 afgerond, 14 bezig, 2 niet gestart". */
  label: string;
  segments: StackSegment[];
  /** Vertraging van de groei-animatie, in stagger-stappen. */
  index?: number;
  className?: string;
};

// Gestapelde balk (afgerond / bezig / niet gestart) met 2px ruimte tussen de delen.
export function StackedBar({ label, segments, index = 0, className }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div
      role="img"
      aria-label={label}
      className={clsx(styles.bar, className)}
      style={{ "--i": index } as React.CSSProperties}
    >
      {segments
        .filter((seg) => seg.value > 0)
        .map((seg) => (
          <span
            key={seg.label}
            title={`${seg.label}: ${seg.value}`}
            className={clsx(styles.segment, styles[seg.tone])}
            style={{ flexGrow: total ? seg.value / total : 0 }}
          />
        ))}
    </div>
  );
}

// Legenda met kleurstaal en aantallen; dezelfde volgorde als de balk.
export function StackLegend({ segments, className }: { segments: StackSegment[]; className?: string }) {
  return (
    <ul className={clsx(styles.legend, className)}>
      {segments.map((seg) => (
        <li key={seg.label} className={styles.legendItem}>
          <span className={clsx(styles.swatch, styles[seg.tone])} aria-hidden />
          <span className={styles.legendLabel}>{seg.label}</span>
          <span className={styles.legendValue}>{seg.value}</span>
        </li>
      ))}
    </ul>
  );
}
