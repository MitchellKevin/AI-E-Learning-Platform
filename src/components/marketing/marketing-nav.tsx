"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Menu as MenuIcon, X } from "lucide-react";
import { Button, IconButton } from "@/components/kit";
import styles from "./marketing-header.module.scss";

export const marketingNavItems = [
  { href: "/#product", label: "Product" },
  { href: "/#leerpaden", label: "Leerpaden" },
  { href: "/prijzen", label: "Prijzen" },
  { href: "/help", label: "Help" },
];

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = `menu${useId().replace(/:/g, "")}`;
  const toggle = useRef<HTMLButtonElement>(null);

  // Esc sluit het menu; op desktop is het niet meer nodig.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => desktop.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav aria-label="Hoofdmenu" className={styles.nav}>
        <ul className={styles.navList}>
          {marketingNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(styles.navItem, active && styles.active)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.actions}>
        <Link href="/inloggen" className={styles.login}>
          Inloggen
        </Link>
        <Button href="/demo" size="sm" className={styles.demo}>
          Plan een demo
        </Button>
        <IconButton
          ref={toggle}
          label={open ? "Menu sluiten" : "Menu openen"}
          icon={open ? <X /> : <MenuIcon />}
          variant="ghost"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className={styles.toggle}
        />
      </div>

      {open && (
        <>
          <div className={styles.scrim} aria-hidden onClick={close} />
          <div id={panelId} className={styles.panel}>
            <nav aria-label="Mobiel menu">
              <ul className={styles.panelList}>
                {marketingNavItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={clsx(styles.panelItem, active && styles.active)}
                      >
                        {item.label}
                        <ArrowRight aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className={styles.panelActions}>
              <Button href="/inloggen" variant="secondary" fullWidth onClick={close}>
                Inloggen
              </Button>
              <Button href="/demo" fullWidth onClick={close}>
                Plan een demo
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
