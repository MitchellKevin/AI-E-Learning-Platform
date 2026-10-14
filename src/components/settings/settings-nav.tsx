"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Bell, GraduationCap, Languages, ShieldCheck, UserRound } from "lucide-react";
import { ConfirmDialog } from "@/components/kit";
import { useSettingsContext } from "./settings-context";
import styles from "./settings-nav.module.scss";

const settingsSections = [
  { href: "/instellingen", label: "Account", description: "Naam, functie en inloggen", icon: <UserRound /> },
  { href: "/instellingen/leren", label: "Leren", description: "Weekdoel en herinneringen", icon: <GraduationCap /> },
  { href: "/instellingen/meldingen", label: "Meldingen", description: "E-mail en in-app", icon: <Bell /> },
  { href: "/instellingen/privacy", label: "Privacy", description: "Zichtbaarheid en je gegevens", icon: <ShieldCheck /> },
  { href: "/instellingen/taal", label: "Taal", description: "Taal van de app", icon: <Languages /> },
];

// Sectienavigatie: verticaal op desktop, horizontaal scrollend op mobiel.
export function SettingsNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { dirty, setDirty } = useSettingsContext();
  const [pendingHref, setPendingHref] = useState<string>();
  const navRef = useRef<HTMLElement>(null);

  // Mobiel: de actieve sectie in beeld schuiven in de horizontale rij.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const navBox = nav.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    nav.scrollLeft += box.left - navBox.left - (navBox.width - box.width) / 2;
  }, [pathname]);

  const current = settingsSections.find((s) => s.href === pathname);

  function onNavigate(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!dirty || href === pathname) return;
    // Nieuwe tab of venster: geen waarschuwing nodig.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setPendingHref(href);
  }

  return (
    <>
      <nav ref={navRef} aria-label="Instellingen" className={styles.nav}>
        <ul className={styles.list}>
          {settingsSections.map((section) => {
            const active = section.href === pathname;
            return (
              <li key={section.href} className={styles.item}>
                <Link
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(styles.link, active && styles.active)}
                  onClick={(e) => onNavigate(e, section.href)}
                >
                  <span className={styles.icon} aria-hidden>
                    {section.icon}
                  </span>
                  <span className={styles.text}>
                    <span className={styles.label}>{section.label}</span>
                    <span className={styles.description}>{section.description}</span>
                  </span>
                  {active && dirty && (
                    <span className={styles.dirty} title="Niet-opgeslagen wijzigingen">
                      <span className="visually-hidden">(niet-opgeslagen wijzigingen)</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <ConfirmDialog
        open={pendingHref !== undefined}
        onOpenChange={(open) => !open && setPendingHref(undefined)}
        title="Wijzigingen niet opgeslagen"
        description={`Als je doorgaat, gaan je wijzigingen in ${current?.label ?? "deze sectie"} verloren.`}
        confirmLabel="Doorgaan zonder opslaan"
        cancelLabel="Blijven"
        variant="danger"
        onConfirm={() => {
          if (!pendingHref) return;
          setDirty(false);
          router.push(pendingHref);
        }}
      />
    </>
  );
}
