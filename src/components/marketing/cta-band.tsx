import { Check } from "lucide-react";
import { ArrowButton, Button } from "@/components/kit";
import styles from "./cta-band.module.scss";

type Props = {
  title?: string;
  text?: string;
  secondary?: { href: string; label: string };
  id?: string;
};

const points = ["Demo van 30 minuten", "14 dagen gratis proberen", "Geen creditcard nodig"];

// Afsluitende oproep onderaan marketingpagina's.
export function CtaBand({
  title = "Neem je team mee in werken met AI",
  text = "Plan een demo en zie in een halfuur hoe AI Academy werkt voor jullie designers en developers.",
  secondary = { href: "/prijzen", label: "Bekijk prijzen" },
  id = "cta-titel",
}: Props) {
  return (
    <section aria-labelledby={id} className={styles.section}>
      <div className={styles.card}>
        <div className={styles.pattern} aria-hidden />
        <div className={styles.text}>
          <h2 id={id} className={styles.title}>
            {title}
          </h2>
          <p className={styles.lead}>{text}</p>
          <ul className={styles.points}>
            {points.map((point) => (
              <li key={point}>
                <Check aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.actions}>
          <ArrowButton href="/demo">Plan een demo</ArrowButton>
          <Button href={secondary.href} variant="secondary">
            {secondary.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
