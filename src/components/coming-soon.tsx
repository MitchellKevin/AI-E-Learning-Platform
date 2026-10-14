import Link from "next/link";
import styles from "./coming-soon.module.scss";

export function ComingSoon({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.text}>{children}</p>
      <Link href="/dashboard" className={styles.link}>
        Terug naar dashboard
      </Link>
    </main>
  );
}
