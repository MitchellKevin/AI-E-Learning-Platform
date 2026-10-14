import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { VerifyLookup } from "@/components/profile/verify-lookup";
import styles from "./verify.module.scss";

export const metadata: Metadata = {
  title: "Certificaat controleren · AI Academy",
  description: "Controleer of een certificaat van AI Academy echt is.",
};

export default function VerifyLookupPage() {
  return (
    <main className={styles.main}>
      <article className={styles.card} aria-labelledby="verify-title">
        <div className={styles.status}>
          <span className={`${styles.statusIcon} ${styles.neutral}`} aria-hidden>
            <ShieldCheck />
          </span>
          <p className={styles.eyebrow}>Verificatie</p>
          <h1 id="verify-title" className={styles.title}>
            Certificaat controleren
          </h1>
          <p className={styles.lead}>
            Vul het nummer van een certificaat in. Je ziet direct of het echt door AI Academy is uitgegeven, aan wie
            en voor welk leerpad.
          </p>
        </div>
        <div className={styles.lookup}>
          <VerifyLookup />
        </div>
      </article>
    </main>
  );
}
