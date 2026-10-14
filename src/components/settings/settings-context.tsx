"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Settings } from "@/lib/data/profile";

type SectionKey = keyof Settings;

type SettingsContextValue = {
  /** Heeft het formulier op de huidige pagina niet-opgeslagen wijzigingen? */
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  /** Opgeslagen waarden van deze sessie, zodat wisselen tussen secties ze niet terugzet. */
  saved: Partial<Settings>;
  remember: <K extends SectionKey>(key: K, value: Settings[K]) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState<Partial<Settings>>({});

  const remember = useCallback(<K extends SectionKey>(key: K, value: Settings[K]) => {
    setSaved((current) => ({ ...current, [key]: value }));
  }, []);

  return <SettingsContext.Provider value={{ dirty, setDirty, saved, remember }}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext werkt alleen binnen <SettingsProvider>.");
  return ctx;
}

const isEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Formulierstatus voor één sectie: waarden, wijzigingen t.o.v. de laatst opgeslagen versie, opslaan en herstellen.
export function useSettingsForm<K extends SectionKey>(key: K, initial: Settings[K]) {
  const { setDirty, saved, remember } = useSettingsContext();
  const [baseline, setBaseline] = useState<Settings[K]>(() => (saved[key] as Settings[K] | undefined) ?? initial);
  const [values, setValues] = useState<Settings[K]>(baseline);
  const [saving, setSaving] = useState(false);
  const dirty = !isEqual(values, baseline);

  // De sectienavigatie in de layout moet weten of er iets openstaat.
  useEffect(() => {
    setDirty(dirty);
  }, [dirty, setDirty]);

  useEffect(() => () => setDirty(false), [setDirty]);

  // Waarschuwen bij herladen of sluiten van het tabblad.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function set<F extends keyof Settings[K]>(field: F, value: Settings[K][F]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setValues(baseline);
  }

  // Later: server action die de instellingen in MongoDB bijwerkt.
  // Wat je tijdens het opslaan nog wijzigt, blijft daarna als niet-opgeslagen staan.
  async function save() {
    const snapshot = values;
    setSaving(true);
    await wait(700);
    setBaseline(snapshot);
    remember(key, snapshot);
    setSaving(false);
  }

  return { values, setValues, set, dirty, saving, save, reset };
}
