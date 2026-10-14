"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./step-frame.module.scss";

export type StepFrameProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Enter of de primaire knop (type="submit") roept dit aan. Geef `false` terug bij een fout. */
  onSubmit: () => boolean | void;
  /** Knoppen links (meestal "Terug"). */
  back?: ReactNode;
  /** Knoppen rechts; de laatste is de primaire actie. */
  actions: ReactNode;
  /** Zet de focus op de titel zodra deze stap verschijnt (niet bij het laden van de pagina). */
  focusHeading?: boolean;
  /** Animatierichting bij het wisselen van stap. */
  direction?: "forward" | "back";
  className?: string;
  children?: ReactNode;
};

// Eén scherm van de intake: titel, inhoud en een vaste knoppenbalk onderaan.
export function StepFrame({
  eyebrow,
  title,
  lead,
  onSubmit,
  back,
  actions,
  focusHeading,
  direction = "forward",
  className,
  children,
}: StepFrameProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);

  // Alleen bij mounten: elke stap (en elke toetsvraag) is een nieuw scherm.
  useEffect(() => {
    const el = heading.current;
    if (!focusHeading || !el) return;
    el.focus({ preventScroll: true });
    // Op mobiel sta je na "Volgende" vaak onderaan; begin de nieuwe stap bovenaan.
    if (el.getBoundingClientRect().top < 72) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    }
  }, [focusHeading]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onSubmit() !== false) return;
    // Na een fout: focus naar het eerste veld dat aandacht nodig heeft (pas na de re-render).
    requestAnimationFrame(() => {
      const el = form.current;
      const target =
        el?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        el?.querySelector<HTMLElement>("input:not([disabled]):not([type=hidden])");
      target?.focus();
    });
  }

  return (
    <form ref={form} onSubmit={handleSubmit} noValidate className={clsx(styles.frame, styles[direction], className)}>
      <header className={styles.head}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 ref={heading} tabIndex={-1} className={styles.title}>
          {title}
        </h1>
        {lead && <p className={styles.lead}>{lead}</p>}
      </header>

      {children && <div className={styles.body}>{children}</div>}

      <div className={styles.footer}>
        <div className={styles.footerStart}>{back}</div>
        <div className={styles.footerEnd}>{actions}</div>
      </div>
    </form>
  );
}
