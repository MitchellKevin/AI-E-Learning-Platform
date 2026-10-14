import { ChevronDown } from "lucide-react";
import type { HelpFaq as Faq } from "@/lib/data/help";
import { HelpInline } from "./help-article-body";
import styles from "./help-faq.module.scss";

// Accordion met native details: werkt zonder JavaScript en met het toetsenbord.
export function HelpFaq({ items }: { items: Faq[] }) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <details key={item.id} id={`faq-${item.id}`} className={styles.item}>
          <summary className={styles.summary}>
            <h3 className={styles.question}>{item.question}</h3>
            <ChevronDown className={styles.chevron} aria-hidden />
          </summary>
          <div className={styles.answer}>
            <p>
              <HelpInline text={item.answer} />
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
