import Link from "next/link";
import clsx from "clsx";
import { useId, type ReactNode } from "react";
import styles from "./section.module.scss";

export type SectionProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Tekstlink rechts van de titel, bv. { href: "/leerpaden", label: "Alle leerpaden" }. */
  link?: { href: string; label: string };
  /** Eigen inhoud rechts van de titel (knop, filter); gaat vóór `link`. */
  actions?: ReactNode;
  headingLevel?: 2 | 3;
  id?: string;
  className?: string;
  children?: ReactNode;
};

// Blok met kop zoals "Jouw leerpaden" op het dashboard.
export function Section({
  title,
  description,
  link,
  actions,
  headingLevel = 2,
  id,
  className,
  children,
}: SectionProps) {
  const autoId = useId().replace(/:/g, "");
  const headingId = `${id ?? `section${autoId}`}-title`;
  const Heading = `h${headingLevel}` as const;

  return (
    <section id={id} aria-labelledby={headingId} className={clsx(styles.section, className)}>
      <div className={styles.head}>
        <div className={styles.titles}>
          <Heading id={headingId} className={clsx(styles.title, headingLevel === 3 && styles.small)}>
            {title}
          </Heading>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {(actions || link) && (
          <div className={styles.actions}>
            {actions}
            {link && (
              <Link href={link.href} className={styles.link}>
                {link.label}
              </Link>
            )}
          </div>
        )}
      </div>
      {children && <div className={styles.body}>{children}</div>}
    </section>
  );
}
