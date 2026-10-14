import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./kbd.module.scss";

// Toetsaanduiding, bv. <Kbd>⌘</Kbd><Kbd>K</Kbd>.
export function Kbd({ className, children }: { className?: string; children: ReactNode }) {
  return <kbd className={clsx(styles.kbd, className)}>{children}</kbd>;
}
