import styles from "./skip-link.module.scss";

// Eerste tabstop op elke app-pagina: direct naar de inhoud, langs de header.
export function SkipLink({ target = "main" }: { target?: string }) {
  return (
    <a href={`#${target}`} className={styles.skip}>
      Naar hoofdinhoud
    </a>
  );
}

// Doel van de skiplink. Pagina's houden hun eigen <main>; deze wrapper krijgt alleen de focus.
export function MainRegion({ id = "main", children }: { id?: string; children: React.ReactNode }) {
  return (
    <div id={id} tabIndex={-1} className={styles.region}>
      {children}
    </div>
  );
}
