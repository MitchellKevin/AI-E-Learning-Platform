"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { Button, Field, Select, TextInput, useToast } from "@/components/kit";
import { isValidEmail, isValidNlVat, isValidPostalCode, normalizeVat, type BillingDetails } from "@/lib/data/admin-org";
import { Panel } from "../panel";
import { wait } from "../utils";
import styles from "./billing-details-form.module.scss";

type Key = keyof BillingDetails;
type Errors = Partial<Record<Key, string>>;

const COUNTRIES = ["Nederland", "België", "Duitsland"];

// Btw-nummers buiten Nederland: landcode + 8 tot 12 tekens (de controle doet VIES straks).
const EU_VAT = /^(BE|DE)[0-9A-Z]{8,12}$/;

function validate(values: BillingDetails): Errors {
  const errors: Errors = {};
  if (!values.companyName.trim()) errors.companyName = "Vul de bedrijfsnaam in.";
  if (!values.street.trim()) errors.street = "Vul straat en huisnummer in.";
  if (values.country === "Nederland" && !isValidPostalCode(values.postalCode))
    errors.postalCode = "Gebruik het formaat 1234 AB.";
  else if (!values.postalCode.trim()) errors.postalCode = "Vul de postcode in.";
  if (!values.city.trim()) errors.city = "Vul de plaats in.";
  if (values.country === "Nederland") {
    if (!isValidNlVat(values.vatNumber)) errors.vatNumber = "Gebruik het formaat NL123456789B01.";
  } else if (!EU_VAT.test(normalizeVat(values.vatNumber))) {
    errors.vatNumber = "Dit btw-nummer klopt niet. Begin met de landcode, bijvoorbeeld BE0123456789.";
  }
  if (!isValidEmail(values.invoiceEmail)) errors.invoiceEmail = "Vul een geldig e-mailadres in.";
  return errors;
}

const ORDER: Key[] = ["companyName", "street", "postalCode", "city", "vatNumber", "invoiceEmail"];

export function BillingDetailsForm({ initial }: { initial: BillingDetails }) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const dirty = ORDER.concat("country", "reference").some((k) => values[k] !== saved[k]);

  function set(key: Key, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setJustSaved(false);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // Direct na verlaten van het veld controleren, maar alleen als er iets is ingevuld.
  function blurCheck(key: Key) {
    if (!values[key].trim()) return;
    if (key === "vatNumber") setValues((v) => ({ ...v, vatNumber: normalizeVat(v.vatNumber) }));
    if (key === "postalCode" && values.country === "Nederland" && isValidPostalCode(values.postalCode)) {
      const pc = values.postalCode.replace(/\s/g, "").toUpperCase();
      setValues((v) => ({ ...v, postalCode: `${pc.slice(0, 4)} ${pc.slice(4)}` }));
    }
    const error = validate({ ...values, vatNumber: normalizeVat(values.vatNumber) })[key];
    setErrors((e) => ({ ...e, [key]: error }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || busy) return;
    const normalized = { ...values, vatNumber: normalizeVat(values.vatNumber) };
    const next = validate(normalized);
    setErrors(next);
    const first = ORDER.find((k) => next[k]);
    if (first) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setBusy(true);
    // Straks: server action die de klantgegevens in Stripe bijwerkt.
    await wait(900);
    setBusy(false);
    setValues(normalized);
    setSaved(normalized);
    setJustSaved(true);
    toast({ variant: "success", title: "Factuurgegevens opgeslagen", description: "Ze staan op je volgende factuur." });
  }

  const field = (key: Key) => ({
    name: key,
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value),
    onBlur: () => blurCheck(key),
  });

  return (
    <form ref={formRef} onSubmit={submit} noValidate className={styles.form}>
      <Panel
        title="Factuurgegevens"
        description="Deze gegevens staan op elke factuur. Wijzigingen gelden vanaf de volgende factuur."
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
                <Button
                  variant="ghost"
                  onClick={() => {
                    setValues(saved);
                    setErrors({});
                  }}
                  disabled={busy}
                >
                  Herstellen
                </Button>
              )}
              <Button type="submit" loading={busy} disabled={!dirty}>
                Opslaan
              </Button>
            </div>
          </>
        }
        className={clsx(dirty && styles.dirty)}
      >
        <div className={styles.grid}>
          <Field label="Bedrijfsnaam" required error={errors.companyName} className={styles.full}>
            <TextInput {...field("companyName")} autoComplete="organization" />
          </Field>
          <Field label="Straat en huisnummer" required error={errors.street} className={styles.full}>
            <TextInput {...field("street")} autoComplete="street-address" />
          </Field>
          <Field label="Postcode" required error={errors.postalCode}>
            <TextInput {...field("postalCode")} autoComplete="postal-code" maxLength={10} />
          </Field>
          <Field label="Plaats" required error={errors.city}>
            <TextInput {...field("city")} autoComplete="address-level2" />
          </Field>
          <Field label="Land" className={styles.full}>
            <Select
              name="country"
              value={values.country}
              onChange={(e) => {
                set("country", e.target.value);
                setErrors((er) => ({ ...er, vatNumber: undefined, postalCode: undefined }));
              }}
              autoComplete="country-name"
            >
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field
            label="Btw-nummer"
            required
            error={errors.vatNumber}
            description={values.country === "Nederland" ? "Bijvoorbeeld NL859123456B01." : "Met landcode ervoor."}
          >
            <TextInput {...field("vatNumber")} spellCheck={false} autoCapitalize="characters" />
          </Field>
          <Field label="Inkoopnummer" optional description="Bijvoorbeeld een PO-nummer van je finance-afdeling.">
            <TextInput {...field("reference")} />
          </Field>
          <Field
            label="Factuur-e-mail"
            required
            error={errors.invoiceEmail}
            description="Facturen gaan naar dit adres, naast de beheerders."
            className={styles.full}
          >
            <TextInput type="email" {...field("invoiceEmail")} autoComplete="email" />
          </Field>
        </div>
      </Panel>
    </form>
  );
}
