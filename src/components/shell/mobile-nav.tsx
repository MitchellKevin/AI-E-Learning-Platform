"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Award, Flame, LayoutGrid, LifeBuoy, LogOut, Menu as MenuIcon, Settings, Star, User } from "lucide-react";
import { Avatar, Drawer } from "@/components/kit";
import { isActivePath, navItems } from "./nav-items";
import type { ShellUser } from "./user-menu";
import btn from "./header-button.module.scss";
import { signOutAction } from "@/server/actions/auth";
import styles from "./mobile-nav.module.scss";

type Props = {
  user: ShellUser;
  /** Al geformatteerd, bv. "2.340". */
  points: string;
  streak: number;
};

// Op kleine schermen klapt de navigatie in tot een menuknop met een schuifpaneel.
export function MobileNav({ user, points, streak }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  const accountLinks = [
    { href: "/profiel", label: "Mijn profiel", icon: <User /> },
    { href: "/profiel/certificaten", label: "Certificaten", icon: <Award /> },
    { href: "/instellingen", label: "Instellingen", icon: <Settings /> },
    ...(user.canManage ? [{ href: "/beheer", label: "Beheer", icon: <LayoutGrid /> }] : []),
    { href: "/help", label: "Help", icon: <LifeBuoy /> },
  ];

  // Het meest specifieke pad wint, zodat Certificaten niet ook Profiel actief maakt.
  const activeAccount = accountLinks
    .filter((l) => isActivePath(pathname, l.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={btn.iconButton}
        aria-label="Menu openen"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon aria-hidden />
      </button>

      <Drawer open={open} onOpenChange={setOpen} title="Menu" bodyClassName={styles.body}>
        <div className={styles.profile}>
          <Avatar initials={user.initials} size={44} />
          <div className={styles.profileText}>
            <p className={styles.name}>{user.name}</p>
            <p className={styles.meta}>
              Team {user.team} · {user.organisation}
            </p>
          </div>
        </div>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>
              <Flame aria-hidden /> Streak
            </dt>
            <dd>{streak} dagen</dd>
          </div>
          <div className={styles.stat}>
            <dt>
              <Star aria-hidden /> Punten
            </dt>
            <dd>{points}</dd>
          </div>
        </dl>

        <nav aria-label="Hoofdmenu" className={styles.section}>
          <ul className={styles.list}>
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(styles.link, styles.primary, active && styles.active)}
                    onClick={close}
                  >
                    <span className={styles.icon} aria-hidden>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-label="Account" className={styles.section}>
          <p className={styles.sectionLabel}>Account</p>
          <ul className={styles.list}>
            {accountLinks.map((item) => {
              const active = item.href === activeAccount;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(styles.link, active && styles.active)}
                    onClick={close}
                  >
                    <span className={styles.icon} aria-hidden>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button type="button" className={clsx(styles.link, styles.danger)} onClick={() => signOutAction()}>
                <span className={styles.icon} aria-hidden>
                  <LogOut />
                </span>
                Uitloggen
              </button>
            </li>
          </ul>
        </nav>
      </Drawer>
    </div>
  );
}
