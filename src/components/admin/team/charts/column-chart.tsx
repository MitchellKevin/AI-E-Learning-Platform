import clsx from "clsx";
import type { ReactNode } from "react";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/kit";
import styles from "./column-chart.module.scss";

export type ColumnPoint = { key: string; label: string; fullLabel: string; value: number };

type Props = {
  /** Naam van de grafiek voor screenreaders en de tabelweergave. */
  label: string;
  points: ColumnPoint[];
  /** Eenheid achter de waarde, bv. "min" of "uur". */
  unit: string;
  /** Kop van de waardekolom in de tabelweergave. */
  valueLabel: string;
  caption?: ReactNode;
  /** Hoogte van het plotvlak in px. */
  height?: number;
  className?: string;
};

const format = (n: number) => n.toLocaleString("nl-NL", { maximumFractionDigits: 1 });

// Mooie bovengrens voor de as: 1, 2 of 5 × 10^n.
function niceMax(value: number) {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * exp >= value)!;
  return step * exp;
}

// Kolommen met rustige rasterlijnen; waarde bij hover/focus, en altijd als tabel op te vragen.
export function ColumnChart({ label, points, unit, valueLabel, caption, height = 140, className }: Props) {
  const max = niceMax(Math.max(...points.map((p) => p.value), 0));
  const peak = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0);
  const last = points.length - 1;

  return (
    <figure className={clsx(styles.figure, points.length > 8 && styles.dense, className)}>
      <div className={styles.plot} style={{ "--h": `${height}px` } as React.CSSProperties}>
        <div className={styles.grid} aria-hidden>
          {[max, max / 2, 0].map((v) => (
            <span key={v} className={styles.gridLine}>
              <span className={styles.gridLabel}>{format(v)}</span>
            </span>
          ))}
        </div>

        <ol className={styles.columns} aria-label={label}>
          {points.map((p, i) => {
            const text = `${p.fullLabel}: ${format(p.value)} ${unit}`;
            const labelled = p.value > 0 && (i === peak || i === last);
            return (
              <li
                key={p.key}
                tabIndex={0}
                aria-label={text}
                className={clsx(styles.column, i < 2 && styles.edgeStart, i > last - 2 && styles.edgeEnd)}
                style={{ "--i": i, "--v": p.value / max } as React.CSSProperties}
              >
                <span className={styles.track} aria-hidden>
                  {labelled && <span className={styles.value}>{format(p.value)}</span>}
                  <span className={clsx(styles.bar, i === last && styles.current, p.value === 0 && styles.empty)} />
                </span>
                <span className={styles.tip} aria-hidden>
                  <strong>
                    {format(p.value)} {unit}
                  </strong>
                  <span>{p.fullLabel}</span>
                </span>
                <span className={styles.x} aria-hidden>
                  {p.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}

      <details className={styles.details}>
        <summary className={styles.summary}>Bekijk als tabel</summary>
        <Table label={label} minWidth={0} bare containerClassName={styles.table}>
          <THead>
            <Tr>
              <Th>Periode</Th>
              <Th align="end">{valueLabel}</Th>
            </Tr>
          </THead>
          <TBody>
            {points.map((p) => (
              <Tr key={p.key}>
                <Td>{p.fullLabel}</Td>
                <Td numeric>
                  {format(p.value)} {unit}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </details>
    </figure>
  );
}
