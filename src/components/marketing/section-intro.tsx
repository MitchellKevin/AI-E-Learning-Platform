import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./section-intro.module.scss";

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Id voor aria-labelledby op de omliggende sectie. */
  id?: string;
  align?: "start" | "center";
  headingLevel?: 1 | 2;
  className?: string;
  children?: ReactNode;
};

// Kop van een marketingsectie: blauw kopje, grote titel en een korte inleiding.
export function SectionIntro({ eyebrow, title, lead, id, align = "start", headingLevel = 2, className, children }: Props) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={clsx(styles.intro, styles[align], className)}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <Heading id={id} className={clsx(styles.title, headingLevel === 1 && styles.large)}>
        {title}
      </Heading>
      {lead && <p className={styles.lead}>{lead}</p>}
      {children}
    </div>
  );
}
