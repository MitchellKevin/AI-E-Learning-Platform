import type { ReactNode } from "react";
import styles from "./admin-page.module.scss";

// Inhoud van een beheerpagina: blokken onder elkaar die na elkaar binnenkomen.
export function AdminPage({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
