"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Check, ImageUp, Trash2, TriangleAlert } from "lucide-react";
import { Button, Field, TextInput, buttonClassName, useToast } from "@/components/kit";
import type { OrgProfile } from "@/lib/data/admin-org";
import { Panel } from "../panel";
import { wait } from "../utils";
import styles from "./org-profile-form.module.scss";

const PRESETS = [
  { value: "#1d4ed8", label: "Blauw" },
  { value: "#0f766e", label: "Petrol" },
  { value: "#15803d", label: "Groen" },
  { value: "#b45309", label: "Oker" },
  { value: "#be123c", label: "Framboos" },
  { value: "#6d28d9", label: "Paars" },
  { value: "#0f172a", label: "Inkt" },
];

const HEX = /^#[0-9a-f]{6}$/i;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

// Contrast met wit (WCAG), om te waarschuwen voor te lichte kleuren.
function contrastWithWhite(hex: string) {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return 1.05 / (l + 0.05);
}

const toInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

type Values = { name: string; website: string; brandColor: string };

export function OrgProfileForm({ initial }: { initial: OrgProfile }) {
  const start: Values = { name: initial.name, website: initial.website, brandColor: initial.brandColor };
  const [saved, setSaved] = useState(start);
  const [values, setValues] = useState(start);
  const [hexDraft, setHexDraft] = useState(initial.brandColor);
  const [logo, setLogo] = useState<{ url: string; name: string } | null>(null);
  const [savedLogo, setSavedLogo] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; website?: string; logo?: string; color?: string }>({});
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);
  const id = useId().replace(/:/g, "");
  const { toast } = useToast();

  const dirty =
    values.name !== saved.name ||
    values.website !== saved.website ||
    values.brandColor !== saved.brandColor ||
    (logo?.url ?? null) !== savedLogo;
  const contrast = contrastWithWhite(values.brandColor);
  const initials = toInitials(values.name);

  // Lokale voorvertoning opruimen als het logo wordt vervangen (het opgeslagen logo blijft).
  const savedLogoRef = useRef(savedLogo);
  useEffect(() => {
    savedLogoRef.current = savedLogo;
  }, [savedLogo]);
  useEffect(() => {
    const url = logo?.url;
    return () => {
      if (url && url !== savedLogoRef.current) URL.revokeObjectURL(url);
    };
  }, [logo]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setJustSaved(false);
  }

  function pickColor(hex: string) {
    set("brandColor", hex.toLowerCase());
    setHexDraft(hex.toLowerCase());
    setErrors((e) => ({ ...e, color: undefined }));
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/svg+xml", "image/jpeg"].includes(file.type)) {
      setErrors((er) => ({ ...er, logo: "Kies een PNG-, SVG- of JPG-bestand." }));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setErrors((er) => ({ ...er, logo: "Dit bestand is groter dan 2 MB." }));
      return;
    }
    setErrors((er) => ({ ...er, logo: undefined }));
    // Straks: upload naar opslag; nu alleen een lokale voorvertoning.
    setLogo({ url: URL.createObjectURL(file), name: file.name });
    setJustSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || busy) return;
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Vul de naam van je organisatie in.";
    if (values.website.trim() && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(values.website.trim()))
      next.website = "Begin met https://, bijvoorbeeld https://studionoord.nl.";
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.website) return websiteRef.current?.focus();

    setBusy(true);
    // Straks: server action die het organisatieprofiel opslaat.
    await wait(900);
    setBusy(false);
    setSaved(values);
    setSavedLogo(logo?.url ?? null);
    setJustSaved(true);
    toast({
      variant: "success",
      title: "Organisatieprofiel opgeslagen",
      description: "Nieuwe certificaten krijgen deze stijl.",
    });
  }

  function reset() {
    setValues(saved);
    setHexDraft(saved.brandColor);
    setLogo(savedLogo ? { url: savedLogo, name: "logo" } : null);
    setErrors({});
  }

  return (
    <form onSubmit={submit} noValidate className={clsx(styles.form, dirty && styles.dirty)}>
      <Panel
        title="Profiel"
        description="Zo ziet je organisatie eruit in AI Academy en op de certificaten van je collega's."
        footer={
          <>
            <p className={styles.status} aria-live="polite">
              {dirty ? (
                <>
                  <span className={styles.dot} aria-hidden />
                  Niet-opgeslagen wijzigingen
                </>
              ) : justSaved ? (
                <span className={styles.saved}>
                  <Check aria-hidden />
                  Opgeslagen
                </span>
              ) : null}
            </p>
            <div className={styles.buttons}>
              {dirty && (
                <Button variant="ghost" onClick={reset} disabled={busy}>
                  Herstellen
                </Button>
              )}
              <Button type="submit" loading={busy} disabled={!dirty}>
                Opslaan
              </Button>
            </div>
          </>
        }
      >
        <div className={styles.layout}>
          <div className={styles.fields}>
            <div className={styles.group}>
              <p className={styles.groupLabel}>Logo</p>
              <div className={styles.logoRow}>
                <span className={styles.logo} style={{ "--brand": values.brandColor } as React.CSSProperties}>
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo.url} alt={`Logo van ${values.name || "je organisatie"}`} />
                  ) : (
                    <span aria-hidden>{initials}</span>
                  )}
                </span>
                <div className={styles.logoActions}>
                  <div className={styles.logoButtons}>
                    <input
                      id={`${id}-file`}
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={onFile}
                      aria-describedby={`${id}-logo-help${errors.logo ? ` ${id}-logo-error` : ""}`}
                      className={clsx("visually-hidden", styles.fileInput)}
                    />
                    <label htmlFor={`${id}-file`} className={buttonClassName({ variant: "secondary", size: "sm" })}>
                      <ImageUp aria-hidden className={styles.uploadIcon} />
                      {logo ? "Ander logo kiezen" : "Logo uploaden"}
                    </label>
                    {logo && (
                      <Button variant="ghost" size="sm" icon={<Trash2 />} onClick={() => setLogo(null)}>
                        Verwijderen
                      </Button>
                    )}
                  </div>
                  <p id={`${id}-logo-help`} className={styles.help}>
                    {logo ? logo.name : "Zonder logo tonen we je initialen."} PNG, SVG of JPG, vierkant, max. 2 MB.
                  </p>
                  {errors.logo && (
                    <p id={`${id}-logo-error`} className={styles.error} role="alert">
                      {errors.logo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Field label="Naam van de organisatie" required error={errors.name}>
              <TextInput
                ref={nameRef}
                value={values.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  setErrors((er) => ({ ...er, name: undefined }));
                }}
                autoComplete="organization"
                maxLength={60}
              />
            </Field>

            <Field
              label="Website"
              optional
              error={errors.website}
              description="Staat op de verificatiepagina van certificaten."
            >
              <TextInput
                ref={websiteRef}
                type="url"
                value={values.website}
                onChange={(e) => {
                  set("website", e.target.value);
                  setErrors((er) => ({ ...er, website: undefined }));
                }}
                placeholder="https://"
                autoComplete="url"
              />
            </Field>

            <fieldset className={styles.colorSet}>
              <legend className={styles.groupLabel}>Merkkleur voor certificaten</legend>
              <p className={styles.help}>Gebruikt voor de rand, het logo en de accenten op elk certificaat.</p>
              <div className={styles.swatches}>
                {PRESETS.map((preset) => (
                  <label key={preset.value} className={styles.swatch} title={preset.label}>
                    <input
                      type="radio"
                      name={`${id}-color`}
                      value={preset.value}
                      checked={values.brandColor === preset.value}
                      onChange={() => pickColor(preset.value)}
                      className={styles.swatchInput}
                    />
                    <span className={styles.swatchDot} style={{ background: preset.value }} aria-hidden>
                      <Check />
                    </span>
                    <span className="visually-hidden">{preset.label}</span>
                  </label>
                ))}
                <label className={styles.custom} title="Eigen kleur kiezen">
                  <input
                    type="color"
                    value={values.brandColor}
                    onChange={(e) => pickColor(e.target.value)}
                    className={styles.colorInput}
                  />
                  <span className="visually-hidden">Eigen kleur kiezen</span>
                </label>
              </div>
              <Field label="Hexcode van de merkkleur" hideLabel error={errors.color} className={styles.hexField}>
                <TextInput
                  value={hexDraft}
                  onChange={(e) => {
                    const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                    setHexDraft(v);
                    if (HEX.test(v)) pickColor(v);
                  }}
                  onBlur={() => {
                    if (!HEX.test(hexDraft)) setErrors((er) => ({ ...er, color: "Gebruik een hexcode als #1d4ed8." }));
                  }}
                  maxLength={7}
                  spellCheck={false}
                  icon={<span className={styles.hexPreview} style={{ background: values.brandColor }} />}
                />
              </Field>
              {contrast < 3 && (
                <p className={styles.warning} role="status">
                  <TriangleAlert aria-hidden />
                  Deze kleur is erg licht en slecht leesbaar op wit. Kies liever een donkerdere tint.
                </p>
              )}
            </fieldset>
          </div>

          <figure className={styles.previewWrap}>
            <div
              className={styles.certificate}
              style={{ "--brand": values.brandColor } as React.CSSProperties}
              aria-hidden
            >
              <div className={styles.certTop}>
                <span className={styles.certLogo}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {logo ? <img src={logo.url} alt="" /> : initials}
                </span>
                <span className={styles.certAcademy}>
                  <strong>AI</strong> Academy
                </span>
              </div>
              <p className={styles.certKicker}>Certificaat van voltooiing</p>
              <p className={styles.certName}>Sanne Visser</p>
              <p className={styles.certText}>heeft het leerpad AI 101 met succes afgerond.</p>
              <div className={styles.certFoot}>
                <span>{values.name || "Je organisatie"}</span>
                <span>AIA-101-2026-0482</span>
              </div>
            </div>
            <figcaption className={styles.caption}>
              Voorbeeld van een certificaat.{" "}
              <Link href="/profiel/certificaten/ai-101">Bekijk een echt certificaat</Link>
            </figcaption>
          </figure>
        </div>
      </Panel>
    </form>
  );
}
