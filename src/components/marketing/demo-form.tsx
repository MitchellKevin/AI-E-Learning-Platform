"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Building2, Check, CircleAlert, Mail, User } from "lucide-react";
import { Alert, Button, Checkbox, Field, Select, TextInput, Textarea } from "@/components/kit";
import type { DemoOptions } from "@/lib/data/marketing";
import styles from "./demo-form.module.scss";

type Values = {
  naam: string;
  email: string;
  bedrijf: string;
  teamgrootte: string;
  rol: string;
  abonnement: string;
  bericht: string;
  toestemming: boolean;
};

type FieldName = keyof Values;
type Errors = Partial<Record<FieldName, string>>;

const MESSAGE_MAX = 1000;

// Gratis mailadressen: voor een demo vragen we om een werkadres.
const FREE_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.nl",
  "outlook.com",
  "outlook.nl",
  "live.com",
  "live.nl",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "ziggo.nl",
  "kpnmail.nl",
  "planet.nl",
  "proton.me",
  "protonmail.com",
]);

function validateField(name: FieldName, values: Values): string | undefined {
  switch (name) {
    case "naam":
      return values.naam.trim().length < 2 ? "Vul je naam in." : undefined;
    case "email": {
      const email = values.email.trim().toLowerCase();
      if (!email) return "Vul je werk-e-mailadres in.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Dit lijkt geen geldig e-mailadres. Controleer het nog even.";
      if (FREE_MAIL.has(email.split("@")[1])) return "Gebruik je werkadres, zodat we je organisatie kunnen herkennen.";
      return undefined;
    }
    case "bedrijf":
      return values.bedrijf.trim() ? undefined : "Vul de naam van je organisatie in.";
    case "teamgrootte":
      return values.teamgrootte ? undefined : "Kies hoe groot je team is.";
    case "rol":
      return values.rol ? undefined : "Kies je rol.";
    case "bericht":
      return values.bericht.length > MESSAGE_MAX ? `Houd je bericht korter dan ${MESSAGE_MAX} tekens.` : undefined;
    case "toestemming":
      return values.toestemming ? undefined : "Geef toestemming, zodat we contact met je kunnen opnemen.";
    default:
      return undefined;
  }
}

// Volgorde van het formulier, voor de focus op het eerste foute veld.
const ORDER: FieldName[] = ["naam", "email", "bedrijf", "teamgrootte", "rol", "abonnement", "bericht", "toestemming"];

const fieldId = (name: FieldName) => `demo-${name}`;

type Props = {
  options: DemoOptions;
  plans: { value: string; label: string }[];
  defaultPlan?: string;
};

export function DemoForm({ options, plans, defaultPlan = "" }: Props) {
  const initial: Values = {
    naam: "",
    email: "",
    bedrijf: "",
    teamgrootte: "",
    rol: "",
    abonnement: defaultPlan,
    bericht: "",
    toestemming: false,
  };
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const formRef = useRef<HTMLFormElement>(null);

  const errorCount = Object.values(errors).filter(Boolean).length;

  function set<K extends FieldName>(name: K, value: Values[K]) {
    const next = { ...values, [name]: value };
    setValues(next);
    // Een bestaande fout verdwijnt zodra het veld klopt.
    if (errors[name] || attempted) setErrors((prev) => ({ ...prev, [name]: validateField(name, next) }));
  }

  function blur(name: FieldName) {
    const value = values[name];
    if (attempted || (typeof value === "string" && value.trim() !== "")) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, values) }));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const next: Errors = {};
    for (const name of ORDER) {
      const error = validateField(name, values);
      if (error) next[name] = error;
    }
    setErrors(next);
    setAttempted(true);

    const first = ORDER.find((name) => next[name]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${fieldId(first)}`)?.focus();
      return;
    }

    setStatus("submitting");
    // Hier komt later een server action die de aanvraag opslaat en het salesteam een seintje geeft.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setStatus("success");
  }

  function reset() {
    setValues(initial);
    setErrors({});
    setAttempted(false);
    setStatus("idle");
  }

  if (status === "success") {
    return (
      <DemoSuccess
        name={values.naam}
        email={values.email.trim()}
        company={values.bedrijf.trim()}
        teamSize={options.teamSizes.find((o) => o.value === values.teamgrootte)?.label}
        onReset={reset}
      />
    );
  }

  const fieldProps = (name: FieldName) => ({
    id: fieldId(name),
    error: errors[name],
  });

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby="demo-form-titel"
      aria-busy={status === "submitting" || undefined}
      className={styles.form}
    >
      <div className={styles.head}>
        <h2 id="demo-form-titel" className={styles.title}>
          Vertel iets over je team
        </h2>
        <p className={styles.lead}>Velden met een * zijn verplicht. Het invullen duurt ongeveer een minuut.</p>
      </div>

      {attempted && errorCount > 0 && (
        <Alert variant="danger" title="Nog niet alles is goed ingevuld" className={styles.summary}>
          {errorCount === 1 ? "Controleer het gemarkeerde veld." : `Controleer de ${errorCount} gemarkeerde velden.`}
        </Alert>
      )}

      <div className={styles.grid}>
        <Field label={<Req>Naam</Req>} required {...fieldProps("naam")}>
          <TextInput
            name="naam"
            autoComplete="name"
            placeholder="Voor- en achternaam"
            icon={<User />}
            value={values.naam}
            onChange={(e) => set("naam", e.target.value)}
            onBlur={() => blur("naam")}
          />
        </Field>

        <Field label={<Req>Werk-e-mailadres</Req>} required {...fieldProps("email")}>
          <TextInput
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="naam@bedrijf.nl"
            icon={<Mail />}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => blur("email")}
          />
        </Field>

        <Field label={<Req>Organisatie</Req>} required {...fieldProps("bedrijf")}>
          <TextInput
            name="bedrijf"
            autoComplete="organization"
            placeholder="Naam van je bedrijf"
            icon={<Building2 />}
            value={values.bedrijf}
            onChange={(e) => set("bedrijf", e.target.value)}
            onBlur={() => blur("bedrijf")}
          />
        </Field>

        <Field label={<Req>Teamgrootte</Req>} required {...fieldProps("teamgrootte")}>
          <Select
            name="teamgrootte"
            placeholder="Kies een teamgrootte"
            value={values.teamgrootte}
            onChange={(e) => set("teamgrootte", e.target.value)}
            onBlur={() => blur("teamgrootte")}
          >
            {options.teamSizes.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={<Req>Jouw rol</Req>} required {...fieldProps("rol")}>
          <Select
            name="rol"
            placeholder="Kies je rol"
            value={values.rol}
            onChange={(e) => set("rol", e.target.value)}
            onBlur={() => blur("rol")}
          >
            {options.roles.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Interesse in" optional {...fieldProps("abonnement")}>
          <Select
            name="abonnement"
            value={values.abonnement}
            onChange={(e) => set("abonnement", e.target.value)}
          >
            <option value="">Weet ik nog niet</option>
            {plans.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Waar kunnen we je mee helpen?"
          optional
          description="Bijvoorbeeld hoe jullie nu met AI werken, of wat je met je team wilt bereiken."
          className={styles.full}
          {...fieldProps("bericht")}
        >
          <Textarea
            name="bericht"
            rows={4}
            autoResize
            maxRows={10}
            maxLength={MESSAGE_MAX}
            placeholder="We willen dat ons designteam AI veilig inzet bij onderzoek en concepten…"
            value={values.bericht}
            onChange={(e) => set("bericht", e.target.value)}
            onBlur={() => blur("bericht")}
          />
          <p className={styles.counter} aria-live={values.bericht.length > MESSAGE_MAX - 100 ? "polite" : "off"}>
            {values.bericht.length} / {MESSAGE_MAX} tekens
          </p>
        </Field>

        <div className={styles.full}>
          <Checkbox
            id={fieldId("toestemming")}
            name="toestemming"
            required
            checked={values.toestemming}
            onChange={(e) => set("toestemming", e.target.checked)}
            invalid={Boolean(errors.toestemming)}
            aria-describedby={errors.toestemming ? "demo-toestemming-error" : undefined}
            label={
              <>
                Ik geef AI Academy toestemming om mijn gegevens te gebruiken om contact met me op te nemen over deze
                demo. <Req />
              </>
            }
            description={
              <>
                We delen je gegevens met niemand. Lees meer in onze{" "}
                <Link href="/privacy" className={styles.inlineLink}>
                  privacyverklaring
                </Link>
                .
              </>
            }
          />
          {errors.toestemming && (
            <p id="demo-toestemming-error" className={styles.checkError}>
              <CircleAlert aria-hidden />
              <span>{errors.toestemming}</span>
            </p>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="submit" size="lg" loading={status === "submitting"} iconRight={<ArrowRight />}>
          Demo aanvragen
        </Button>
        <p className={styles.response}>We reageren binnen één werkdag.</p>
      </div>
    </form>
  );
}

// Verplicht-sterretje; het veld zelf heeft al `required` voor screenreaders.
function Req({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {children}
      <span aria-hidden className={styles.req}>
        {children ? " *" : "*"}
      </span>
    </>
  );
}

function DemoSuccess({
  name,
  email,
  company,
  teamSize,
  onReset,
}: {
  name: string;
  email: string;
  company: string;
  teamSize?: string;
  onReset: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const firstName = name.trim().split(/\s+/)[0];

  // Focus naar de bevestiging, zodat toetsenbord- en screenreadergebruikers weten wat er gebeurd is.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <div className={styles.success}>
      <span className={styles.successIcon} aria-hidden>
        <Check />
      </span>
      <h2 ref={heading} tabIndex={-1} className={styles.successTitle}>
        Bedankt, {firstName}! Je aanvraag is binnen.
      </h2>
      <p className={styles.successText}>
        Binnen één werkdag mailen we je op <strong>{email}</strong> met een paar momenten voor de demo. Kies er een die
        jou uitkomt, dan zetten we hem in de agenda.
      </p>

      <dl className={styles.recap}>
        <div>
          <dt>Organisatie</dt>
          <dd>{company}</dd>
        </div>
        {teamSize && (
          <div>
            <dt>Teamgrootte</dt>
            <dd>{teamSize}</dd>
          </div>
        )}
      </dl>

      <div className={styles.successActions}>
        <Button href="/#leerpaden" variant="secondary" iconRight={<ArrowRight />}>
          Bekijk de leerpaden
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Nog een aanvraag doen
        </Button>
      </div>
    </div>
  );
}
