"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { isActivePath, navItems } from "./shell/nav-items";
import styles from "./app-header.module.scss";

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Hoofdmenu" className={styles.nav}>
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx(styles.navItem, active && styles.active)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
