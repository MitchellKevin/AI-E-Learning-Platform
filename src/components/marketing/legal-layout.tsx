import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Scale } from "lucide-react";
import { Alert, PageHeader } from "@/components/kit";
import { formatDate } from "@/lib/format";
import { LegalToc } from "./legal-toc";
import styles from "./legal-layout.module.scss";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type Props = {
  title: string;
  lead: ReactNode;
  /** ISO-datum van de laatste inhoudelijke wijziging. */
  updatedAt: string;
  /** Pad van deze pagina, voor de markering in "Andere documenten". */
  current: "/privacy" | "/voorwaarden" | "/cookies" | "/toegankelijkheid";
  sections: LegalSection[];
};

const documents = [
  { href: "/privacy", label: "Privacyverklaring" },
  { href: "/voorwaarden", label: "Algemene voorwaarden" },
  { href: "/cookies", label: "Cookiebeleid" },
  { href: "/toegankelijkheid", label: "Toegankelijkheid" },
] as const;

// Gedeelde opmaak voor juridische pagina's: kop met datum, vaste inhoudsopgave en genummerde secties.
export function LegalLayout({ title, lead, updatedAt, current, sections }: Props) {
  return (
    <main>
      <PageHeader band size="lg" eyebrow="Juridisch" title={title} lead={lead}>
        <p className={styles.updated}>
          <CalendarDays aria-hidden />
          Laatst bijgewerkt op <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
        </p>
      </PageHeader>

      <div className={styles.content}>
        <aside className={styles.aside} aria-label="Navigatie juridische documenten">
          <div className={styles.sticky}>
            <LegalToc items={sections.map(({ id, title }) => ({ id, title }))} numbered />
            <nav aria-labelledby="legal-docs-title" className={styles.docs}>
              <p id="legal-docs-title" className={styles.docsTitle}>
                Andere documenten
              </p>
              <ul className={styles.docsList}>
                {documents.map((doc) => (
                  <li key={doc.href}>
                    <Link
                      href={doc.href}
                      aria-current={doc.href === current ? "page" : undefined}
                      className={styles.docsLink}
                    >
                      {doc.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <div className={styles.main}>
          <Alert variant="warning" icon={<Scale />} title="Voorbeeldtekst" className={styles.note}>
            Deze tekst is een uitgewerkt voorbeeld en is nog niet juridisch gecontroleerd. Laat hem beoordelen door een
            jurist voordat je hem publiceert. Dit is geen juridisch advies.
          </Alert>

          {sections.map((section, i) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className={styles.section}>
              <h2 id={`${section.id}-title`} className={styles.heading}>
                <span className={styles.number} aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              <div className={styles.prose}>{section.content}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

// Korte feiten in twee kolommen, bv. bedrijfsgegevens of contact.
export function LegalFacts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className={styles.facts}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// Kaartjes met icoon, bv. de rechten die je hebt onder de AVG.
export function LegalCards({ items }: { items: { icon: ReactNode; title: string; text: ReactNode }[] }) {
  return (
    <ul className={styles.cards}>
      {items.map((item) => (
        <li key={item.title}>
          <div className={styles.cardItem}>
            <span className={styles.cardIcon} aria-hidden>
              {item.icon}
            </span>
            <span>
              <strong className={styles.cardTitle}>{item.title}</strong>
              <span className={styles.cardText}>{item.text}</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
