import clsx from "clsx";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui";
import styles from "./page-header.module.scss";

export type PageHeaderProps = {
  /** Klein blauw kopje boven de titel, bv. de datum of "Beheer". */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Inleidende zin onder de titel. */
  lead?: ReactNode;
  /** Knoppen rechts (op mobiel onder de tekst). */
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  /** Witte band over de volle breedte met lijn onderaan, zoals op detailpagina's. Bevat zelf de container. */
  band?: boolean;
  /** "md" = 36px (dashboard), "lg" = 48px (detailpagina's). */
  size?: "md" | "lg";
  /** Extra inhoud onder de lead, bv. <Tags>. */
  children?: ReactNode;
  className?: string;
};

// Consistente paginakop. Zonder `band` staat hij binnen de container van de pagina.
export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
  breadcrumbs,
  band,
  size = "md",
  children,
  className,
}: PageHeaderProps) {
  const inner = (
    <div className={clsx(styles.inner, band && styles.bandInner)}>
      <div className={styles.text}>
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={clsx(styles.title, styles[size])}>{title}</h1>
        {lead && <p className={styles.lead}>{lead}</p>}
        {children && <div className={styles.extra}>{children}</div>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );

  return <header className={clsx(band ? styles.band : styles.plain, className)}>{inner}</header>;
}
