import clsx from "clsx";
import styles from "./spinner.module.scss";

export type SpinnerProps = {
  /** Diameter in px. */
  size?: number;
  /** Tekst voor screenreaders. */
  label?: string;
  /** Alleen visueel, bv. in een knop die zelf aria-busy heeft. */
  decorative?: boolean;
  className?: string;
};

export function Spinner({ size = 16, label = "Laden…", decorative = false, className }: SpinnerProps) {
  const svg = (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={clsx(styles.spinner, decorative && className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className={styles.track} />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );

  if (decorative) return svg;

  return (
    <span role="status" className={clsx(styles.wrapper, className)}>
      {svg}
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
