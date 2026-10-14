import clsx from "clsx";
import { CircleAlert, CircleCheck, Sparkles } from "lucide-react";
import styles from "./practice-preview.module.scss";

const feedback = [
  { ok: true, text: "Het doel is duidelijk: een welkomsttekst." },
  { ok: false, text: "Voor wie is de tekst? Noem de doelgroep." },
  { ok: false, text: "Geef een maximale lengte mee, bv. 40 woorden." },
];

// Voorbeeld van een oefening: een prompt met de feedback die de AI erop geeft.
export function PracticePreview() {
  return (
    <div
      className={styles.preview}
      role="img"
      aria-label="Voorbeeld van de oefenomgeving: je schrijft een prompt en krijgt direct feedback op doel, doelgroep en lengte."
    >
      <div className={styles.prompt}>
        <span className={styles.label}>Jouw prompt</span>
        <p className={styles.code}>
          Schrijf een welkomsttekst voor nieuwe gebruikers van onze app.
          <span className={styles.caret} />
        </p>
      </div>
      <div className={styles.feedback}>
        <span className={clsx(styles.label, styles.brand)}>
          <Sparkles />
          Feedback
        </span>
        <ul className={styles.list}>
          {feedback.map((item) => (
            <li key={item.text} className={clsx(styles.item, item.ok ? styles.ok : styles.todo)}>
              {item.ok ? <CircleCheck /> : <CircleAlert />}
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
