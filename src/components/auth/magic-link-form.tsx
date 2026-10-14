"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { Alert, Button, Field, TextInput } from "@/components/kit";
import type { SsoDomain } from "@/lib/data/auth";
import styles from "./magic-link-form.module.scss";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const providerLabel = { microsoft: "Microsoft", google: "Google" };

function validate(value: string) {
  if (!value.trim()) return "Vul je e-mailadres in.";
  if (!EMAIL.test(value.trim())) return "Dit lijkt geen geldig e-mailadres. Controleer het nog even.";
  return undefined;
}

// Kort schudden bij een fout; ook bij een tweede mislukte poging achter elkaar.
function shake(el: Element | null | undefined) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 360, easing: "ease-out" },
  );
}

export function MagicLinkForm({ ssoDomains = [] }: { ssoDomains?: SsoDomain[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const domain = email.trim().toLowerCase().split("@")[1];
  const sso = domain ? ssoDomains.find((d) => d.domain === domain) : undefined;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const message = validate(email);
    setError(message);
    if (message) {
      input.current?.focus();
      shake(input.current?.parentElement);
      return;
    }

    setBusy(true);
    // Later: server action die via Auth.js (e-mailprovider) een inloglink verstuurt.
    await new Promise((resolve) => setTimeout(resolve, 900));
    router.push(`/inloggen/check-je-mail?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <Field
        label="Werk-e-mailadres"
        description="We sturen je een link waarmee je zonder wachtwoord inlogt."
        error={error}
        required
      >
        <TextInput
          ref={input}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="naam@bedrijf.nl"
          icon={<Mail />}
          value={email}
          readOnly={busy}
          onChange={(e) => {
            setEmail(e.target.value);
            // Na de eerste poging meteen laten zien als het klopt.
            if (submitted) setError(validate(e.target.value));
          }}
        />
      </Field>

      {sso && (
        <Alert variant="info" live className={styles.hint}>
          {sso.organisation} logt in via {providerLabel[sso.provider]}. Met de knop hierboven ben je sneller binnen.
        </Alert>
      )}

      <Button type="submit" size="lg" fullWidth loading={busy} iconRight={<ArrowRight />}>
        Stuur inloglink
      </Button>
    </form>
  );
}
