import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import styles from "./layout.module.scss";

// Rustige, gecentreerde omgeving voor inloggen, uitnodigingen en onboarding (zonder app-header).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo} aria-label="AI Academy, naar de homepage">
          <span className={styles.logoMark} aria-hidden>
            AI
          </span>
          <span aria-hidden>Academy</span>
        </Link>
        <Link href="/help" className={styles.help}>
          <LifeBuoy aria-hidden />
          Hulp nodig?
        </Link>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} AI Academy</p>
        <nav aria-label="Juridisch en hulp" className={styles.footerNav}>
          <Link href="/privacy">Privacy</Link>
          <Link href="/voorwaarden">Voorwaarden</Link>
          <Link href="/toegankelijkheid">Toegankelijkheid</Link>
          <Link href="/help">Helpcenter</Link>
        </nav>
      </footer>
    </div>
  );
}
