import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import styles from "./layout.module.scss";

// Openbaar: geen app-header, alleen een eenvoudige kop en voet.
export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>AI</span>
            Academy
          </Link>
          <p className={styles.label}>
            <ShieldCheck aria-hidden />
            Certificaatverificatie
          </p>
        </div>
      </header>
      {children}
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <p>AI Academy · Teams leren werken met AI</p>
          <nav aria-label="Voettekst" className={styles.links}>
            <Link href="/verify">Ander certificaat controleren</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/help">Help</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
