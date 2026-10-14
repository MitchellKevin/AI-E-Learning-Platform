import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./empty-state.module.scss";

export type EmptyStateProps = {
  /** Lucide-icoon, bv. `<Inbox />`. */
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Knop of link, bv. `<Button href="/leerpaden">Bekijk leerpaden</Button>`. */
  action?: ReactNode;
  /** "card" = witte kaart, "dashed" = gestippelde rand, "plain" = zonder rand. */
  variant?: "card" | "dashed" | "plain";
  /** Kop-niveau voor een correcte koppenstructuur. */
  headingLevel?: 2 | 3;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  children,
  action,
  variant = "dashed",
  headingLevel = 3,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={clsx(styles.empty, styles[variant], className)}>
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <Heading className={styles.title}>{title}</Heading>
      {children && <p className={styles.text}>{children}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
