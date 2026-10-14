import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "./auth-card.module.scss";

type Tone = "brand" | "success" | "warning" | "danger";

export type AuthCardProps = {
  /** Icoon in een zacht rondje boven de titel. */
  icon?: ReactNode;
  tone?: Tone;
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  /** Inhoud onder de kaart, buiten het witte vlak (bv. "Nog geen account?"). */
  after?: ReactNode;
  /** Breedte van de kaart: "sm" = inloggen (420px), "md" = uitnodiging (520px). */
  size?: "sm" | "md";
  className?: string;
};

const titleId = "auth-title";

// Witte kaart in het midden van de auth-schermen; de titel is de h1 van de pagina.
export function AuthCard({
  icon,
  tone = "brand",
  eyebrow,
  title,
  lead,
  children,
  after,
  size = "sm",
  className,
}: AuthCardProps) {
  return (
    <div className={clsx(styles.wrap, styles[size], className)}>
      <section aria-labelledby={titleId} className={styles.card}>
        <div className={styles.head}>
          {icon && (
            <span className={clsx(styles.icon, styles[tone])} aria-hidden>
              {icon}
            </span>
          )}
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1 id={titleId} className={styles.title}>
            {title}
          </h1>
          {lead && <p className={styles.lead}>{lead}</p>}
        </div>
        {children && <div className={styles.body}>{children}</div>}
      </section>
      {after && <div className={styles.after}>{after}</div>}
    </div>
  );
}

// Scheidingslijn met tekst in het midden, bv. "of met e-mail".
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className={styles.divider} role="separator" aria-label={typeof children === "string" ? children : undefined}>
      <span aria-hidden>{children}</span>
    </div>
  );
}

// Kleine uitlegtekst onder een formulier.
export function AuthNote({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx(styles.note, className)}>{children}</p>;
}
