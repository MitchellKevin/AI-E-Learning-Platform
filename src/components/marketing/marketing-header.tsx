import Link from "next/link";
import clsx from "clsx";
import { MarketingNav } from "./marketing-nav";
import styles from "./marketing-header.module.scss";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={clsx(styles.logo, className)} aria-label="AI Academy, naar de homepage">
      <span className={styles.logoMark} aria-hidden>
        AI
      </span>
      <span aria-hidden>Academy</span>
    </Link>
  );
}

export function MarketingHeader() {
  return (
    <header className={styles.header}>
      <a href="#inhoud" className={styles.skip}>
        Direct naar de inhoud
      </a>
      <div className={styles.inner}>
        <Logo />
        <MarketingNav />
      </div>
    </header>
  );
}
