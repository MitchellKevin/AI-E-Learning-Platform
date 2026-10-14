import { useId, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./panel.module.scss";

type PanelProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Knop of status rechts van de titel (op mobiel eronder). */
  actions?: ReactNode;
  /** Rode rand en titel, voor onomkeerbare acties. */
  tone?: "default" | "danger";
  headingLevel?: 2 | 3;
  /** Balk onderaan met lijn erboven, bv. opslaan. */
  footer?: ReactNode;
  /** Inhoud tegen de randen, bv. een tabel of lijst. */
  flush?: boolean;
  id?: string;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
};

// Witte beheerkaart met kop, zoals de instellingenkaarten.
export function Panel({
  title,
  description,
  actions,
  tone = "default",
  headingLevel = 2,
  footer,
  flush,
  id,
  className,
  bodyClassName,
  children,
}: PanelProps) {
  const autoId = useId().replace(/:/g, "");
  const titleId = `${id ?? `panel${autoId}`}-title`;
  const Heading = `h${headingLevel}` as const;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={clsx(styles.panel, tone === "danger" && styles.danger, className)}
    >
      <header className={styles.head}>
        <div className={styles.titles}>
          <Heading id={titleId} className={styles.title}>
            {title}
          </Heading>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {children && <div className={clsx(styles.body, flush && styles.flush, bodyClassName)}>{children}</div>}
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </section>
  );
}
