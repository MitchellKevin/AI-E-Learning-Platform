import { Plus } from "lucide-react";
import type { Faq } from "@/lib/data/marketing";
import styles from "./faq-list.module.scss";

// Uitklapbare vragen met native <details>: werkt met toetsenbord en zonder JavaScript.
export function FaqList({ faqs, openFirst }: { faqs: Faq[]; openFirst?: boolean }) {
  return (
    <div className={styles.list}>
      {faqs.map((faq, i) => (
        <details key={faq.question} className={styles.item} open={openFirst && i === 0}>
          <summary className={styles.summary}>
            <span>{faq.question}</span>
            <span className={styles.icon} aria-hidden>
              <Plus />
            </span>
          </summary>
          <p className={styles.answer}>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
