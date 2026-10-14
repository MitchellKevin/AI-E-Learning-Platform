"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { Cookie, Settings2 } from "lucide-react";
import { Badge, Button, Dialog, Switch, useToast, type ButtonProps } from "@/components/kit";
import styles from "./cookie-banner.module.scss";

export type CookieConsent = {
  version: 1;
  analytics: boolean;
  marketing: boolean;
  /** ISO-datum van de keuze; na 12 maanden vragen we het opnieuw. */
  updatedAt: string;
};

type Choice = Pick<CookieConsent, "analytics" | "marketing">;

export const COOKIE_CONSENT_KEY = "aia-cookie-consent";
/** Wordt op window afgevuurd na elke keuze, met de nieuwe consent als detail. */
export const COOKIE_CONSENT_EVENT = "aia:cookie-consent";

const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const NONE: Choice = { analytics: false, marketing: false };
const ALL: Choice = { analytics: true, marketing: true };

// Leest de opgeslagen keuze. Ongeldig, verlopen of geen opslag: null (dan vragen we het opnieuw).
export function readCookieConsent(): CookieConsent | null {
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CookieConsent>;
    if (value.version !== 1 || typeof value.updatedAt !== "string") return null;
    if (Date.now() - new Date(value.updatedAt).getTime() > MAX_AGE_MS) return null;
    return { version: 1, analytics: !!value.analytics, marketing: !!value.marketing, updatedAt: value.updatedAt };
  } catch {
    return null;
  }
}

// Slaat de keuze op en laat de rest van de pagina het weten (bv. om Matomo te laden).
// Later ook naar de server sturen voor het consentlogboek (server action).
function saveCookieConsent(choice: Choice): CookieConsent {
  const consent: CookieConsent = { version: 1, ...choice, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Geen opslag (privévenster): de keuze geldt dan alleen voor dit bezoek.
  }
  window.dispatchEvent(new CustomEvent<CookieConsent>(COOKIE_CONSENT_EVENT, { detail: consent }));
  return consent;
}

function useSaveWithToast() {
  const { toast } = useToast();
  return (choice: Choice) => {
    const consent = saveCookieConsent(choice);
    const description =
      consent.analytics && consent.marketing
        ? "Je hebt alle cookies toegestaan."
        : !consent.analytics && !consent.marketing
          ? "We gebruiken alleen noodzakelijke cookies."
          : `Naast noodzakelijke cookies sta je ${consent.analytics ? "analytische" : "marketing"}cookies toe.`;
    toast({ title: "Cookievoorkeuren opgeslagen", description, variant: "success" });
    return consent;
  };
}

// Volgt de opgeslagen keuze, ook als die elders op de pagina wordt aangepast.
function useStoredConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConsent(readCookieConsent());
    setMounted(true);
    const onChange = (e: Event) => setConsent((e as CustomEvent<CookieConsent>).detail);
    // Andere tabbladen: storage-event.
    const onStorage = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) setConsent(readCookieConsent());
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { consent, mounted };
}

const categories = [
  {
    key: "noodzakelijk",
    label: "Noodzakelijk",
    description: "Nodig om in te loggen, je voortgang te bewaren en formulieren veilig te versturen. Deze staan altijd aan.",
  },
  {
    key: "analytics",
    label: "Analytisch",
    description: "Anonieme bezoekstatistieken via onze eigen Matomo-server in de EU. Zo zien we welke pagina's beter kunnen.",
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Meet of advertenties op LinkedIn leiden tot een demo-aanvraag. Niet actief in de leeromgeving zelf.",
  },
] as const;

type PreferencesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (consent: CookieConsent) => void;
};

// Dialoog met een schakelaar per categorie. Begint bij elke opening bij de opgeslagen keuze.
export function CookiePreferencesDialog({ open, onOpenChange, onSaved }: PreferencesDialogProps) {
  const save = useSaveWithToast();
  const [draft, setDraft] = useState<Choice>(NONE);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const stored = readCookieConsent();
      setDraft(stored ? { analytics: stored.analytics, marketing: stored.marketing } : NONE);
    }
  }

  function commit(choice: Choice) {
    const consent = save(choice);
    onOpenChange(false);
    onSaved?.(consent);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cookie-instellingen"
      description="Kies welke cookies je toestaat. Je kunt dit altijd aanpassen via de link Cookies onderaan elke pagina."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => commit(ALL)}>
            Alles accepteren
          </Button>
          <Button onClick={() => commit(draft)}>Voorkeuren opslaan</Button>
        </>
      }
    >
      <ul className={styles.categories}>
        {categories.map((category) => {
          const locked = category.key === "noodzakelijk";
          return (
            <li key={category.key} className={styles.category}>
              <Switch
                label={
                  <span className={styles.switchLabel}>
                    {category.label}
                    {locked && (
                      <Badge size="sm" variant="neutral">
                        Altijd aan
                      </Badge>
                    )}
                  </span>
                }
                description={category.description}
                checked={locked ? true : draft[category.key]}
                disabled={locked}
                onCheckedChange={
                  locked ? undefined : (checked) => setDraft((d) => ({ ...d, [category.key]: checked }))
                }
              />
            </li>
          );
        })}
      </ul>
      <p className={styles.dialogNote}>
        Welke cookies het precies zijn en hoe lang we ze bewaren, lees je in ons{" "}
        <Link href="/cookies" onClick={() => onOpenChange(false)}>
          cookiebeleid
        </Link>
        .
      </p>
    </Dialog>
  );
}

// Onderbalk bij het eerste bezoek. Rendert pas na het mounten, zodat server en client gelijk blijven.
export function CookieBanner() {
  const { consent, mounted } = useStoredConsent();
  const save = useSaveWithToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState<"hidden" | "shown" | "leaving">("hidden");
  const titleId = `cookie${useId().replace(/:/g, "")}`;
  const ref = useRef<HTMLElement>(null);

  // Tonen zolang er geen (geldige) keuze is. Komt er een keuze bij, ook via de dialoog of een ander
  // tabblad, dan faden we uit.
  useEffect(() => {
    if (!mounted) return;
    if (consent === null) setPhase("shown");
    else setPhase((p) => (p === "shown" ? "leaving" : p));
  }, [mounted, consent]);

  // Vangnet als animationend niet komt (bv. bij reduced motion).
  useEffect(() => {
    if (phase !== "leaving") return;
    const timeout = window.setTimeout(() => setPhase("hidden"), 400);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  function choose(choice: Choice) {
    save(choice);
    setPhase("leaving");
  }

  const leaving = phase === "leaving";
  const visible = phase !== "hidden";

  return (
    <>
      {visible && (
        <section
          ref={ref}
          aria-labelledby={titleId}
          className={clsx(styles.banner, leaving && styles.leaving)}
          onAnimationEnd={(e) => {
            if (leaving && e.target === ref.current) setPhase("hidden");
          }}
        >
          <div className={styles.inner}>
            <span className={styles.icon} aria-hidden>
              <Cookie />
            </span>
            <div className={styles.text}>
              <h2 id={titleId} className={styles.title}>
                Mogen we cookies gebruiken?
              </h2>
              <p className={styles.body}>
                We gebruiken noodzakelijke cookies om AI Academy te laten werken. Met jouw toestemming meten we ook
                anoniem hoe de site wordt gebruikt en of onze advertenties werken.{" "}
                <Link href="/cookies" className={styles.link}>
                  Lees het cookiebeleid
                </Link>
              </p>
            </div>
            <div className={styles.actions}>
              <Button size="sm" variant="ghost" icon={<Settings2 />} onClick={() => setSettingsOpen(true)}>
                Instellingen
              </Button>
              <Button size="sm" variant="secondary" onClick={() => choose(NONE)} disabled={leaving}>
                Alleen noodzakelijk
              </Button>
              <Button size="sm" onClick={() => choose(ALL)} disabled={leaving}>
                Alles accepteren
              </Button>
            </div>
          </div>
        </section>
      )}
      <CookiePreferencesDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

type SettingsButtonProps = Pick<ButtonProps, "variant" | "size" | "className"> & { children?: React.ReactNode };

// Losse knop om de instellingen te openen, bv. in de footer of op /cookies.
export function CookieSettingsButton({ children = "Cookie-instellingen", variant = "secondary", size, className }: SettingsButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} className={className} icon={<Settings2 />} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <CookiePreferencesDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

const statusLabel = (on: boolean) => (on ? "Toegestaan" : "Uit");

// Kaart met je huidige keuze per categorie, voor het cookiebeleid.
export function CookiePreferencesCard() {
  const { consent, mounted } = useStoredConsent();
  const [open, setOpen] = useState(false);
  const titleId = `cookiecard${useId().replace(/:/g, "")}`;

  const rows = [
    { label: "Noodzakelijk", on: true },
    { label: "Analytisch", on: !!consent?.analytics },
    { label: "Marketing", on: !!consent?.marketing },
  ];

  return (
    <section aria-labelledby={titleId} aria-busy={!mounted} className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h3 id={titleId} className={styles.cardTitle}>
            Jouw keuze op dit apparaat
          </h3>
          <p className={styles.cardMeta} aria-live="polite">
            {!mounted
              ? "Je keuze wordt geladen…"
              : consent
                ? `Opgeslagen op ${new Date(consent.updatedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}`
                : "Je hebt nog geen keuze gemaakt. Tot dan gebruiken we alleen noodzakelijke cookies."}
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<Settings2 />} onClick={() => setOpen(true)} disabled={!mounted}>
          Wijzigen
        </Button>
      </div>
      <dl className={styles.statusList}>
        {rows.map((row) => (
          <div key={row.label} className={styles.statusRow}>
            <dt>{row.label}</dt>
            <dd>
              {mounted ? (
                <Badge size="sm" variant={row.on ? "success" : "neutral"} dot>
                  {row.label === "Noodzakelijk" ? "Altijd aan" : statusLabel(row.on)}
                </Badge>
              ) : (
                <span className={styles.statusPlaceholder} aria-hidden />
              )}
            </dd>
          </div>
        ))}
      </dl>
      <CookiePreferencesDialog open={open} onOpenChange={setOpen} />
    </section>
  );
}
