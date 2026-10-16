import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/kit";
import { AuthCard, AuthDivider, AuthNote } from "@/components/auth/auth-card";
import { SsoButtons } from "@/components/auth/sso-buttons";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { DemoLogin } from "@/components/auth/demo-login";
import { SignedInAs } from "@/components/auth/signed-in-as";
import { Button } from "@/components/kit";
import { initialsOf } from "@/server/models/user";
import { getSessionUser } from "@/server/session";
import { demoLoginEnabled, ssoEnabled } from "@/server/env";
import type { SsoProvider } from "@/lib/data/auth";
import { getSsoDomains } from "@/lib/data/auth";
import styles from "./page.module.scss";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Inloggen – AI Academy",
};

// Meldingen als je via een oude of ongeldige link hier terugkomt (?fout=… of Auth.js' ?error=…).
const errors: Record<string, { title: string; body: string }> = {
  sessie: {
    title: "Je sessie is verlopen",
    body: "Je account is gewijzigd of niet meer actief. Log opnieuw in om verder te gaan.",
  },
  "geen-toegang": {
    title: "Geen toegang tot AI Academy",
    body: "Voor dit account is geen organisatie of uitnodiging gevonden. Vraag je beheerder om je uit te nodigen.",
  },
  verlopen: {
    title: "Deze inloglink is verlopen of al gebruikt",
    body: "Inloglinks zijn 15 minuten geldig en werken één keer. Vraag hieronder een nieuwe aan.",
  },
  "sso-verplicht": {
    title: "Log in via je organisatie",
    body: "Je organisatie heeft ingesteld dat je alleen met je werkaccount (SSO) kunt inloggen. Gebruik de knop van Microsoft of Google.",
  },
  gebruikt: {
    title: "Deze inloglink is al gebruikt",
    body: "Elke link werkt één keer. Vraag een nieuwe aan of log in via je organisatie.",
  },
  sso: {
    title: "Inloggen via je organisatie lukte niet",
    body: "Probeer het opnieuw of log in met een link per e-mail. Blijft het misgaan, neem dan contact op met je beheerder.",
  },
};

// Foutcodes van Auth.js vertaald naar onze meldingen.
const authErrors: Record<string, string> = {
  Verification: "verlopen",
  AccessDenied: "geen-toegang",
  CredentialsSignin: "geen-toegang",
  OAuthSignin: "sso",
  OAuthCallbackError: "sso",
  OAuthAccountNotLinked: "sso",
  Configuration: "sso",
};

type SearchParams = { fout?: string; error?: string; next?: string; uitgelogd?: string };

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ fout, error: authError, next, uitgelogd }, ssoDomains, user] = await Promise.all([
    searchParams,
    getSsoDomains(),
    getSessionUser(),
  ]);
  const code = fout ?? (authError ? (authErrors[authError] ?? "sso") : undefined);
  const error = code ? errors[code] : undefined;
  const enabled = (["microsoft", "google"] as SsoProvider[]).filter((p) => ssoEnabled[p]());
  const demo = demoLoginEnabled();

  // Al ingelogd: geen automatische doorverwijzing (die verbergt foutmeldingen en maakt wisselen onmogelijk),
  // maar een keuze tussen verder gaan en uitloggen.
  if (user) {
    const onboarded = Boolean(user.onboarding?.completedAt);
    return (
      <AuthCard eyebrow="Welkom terug" title="Je bent al ingelogd" lead="Ga verder waar je gebleven was, of log uit om met een ander account in te loggen.">
        {error && (
          <Alert variant="warning" title={error.title} live>
            {error.body}
          </Alert>
        )}
        <SignedInAs
          name={`${user.firstName} ${user.lastName}`.trim()}
          email={user.email}
          initials={initialsOf(user.firstName, user.lastName, user.email)}
        />
        <Button href={onboarded ? safeNext(next) : "/welkom"} size="lg" fullWidth>
          {onboarded ? "Naar je dashboard" : "Verder met de intake"}
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Welkom terug"
      title="Inloggen bij AI Academy"
      lead="Log in met het account van je organisatie of ontvang een inloglink per e-mail."
      after={
        <>
          <p>
            Nog geen AI Academy voor je bedrijf? <Link href="/demo">Vraag een demo aan</Link>
          </p>
          {demo && <DemoLogin next={next} />}
        </>
      }
    >
      {uitgelogd && !error && (
        <Alert variant="success" live>
          Je bent uitgelogd. Tot de volgende les!
        </Alert>
      )}
      {error && (
        <Alert variant="warning" title={error.title} live>
          {error.body}
        </Alert>
      )}

      <SsoButtons next={next ?? "/dashboard"} enabled={enabled} />
      <AuthDivider>of met e-mail</AuthDivider>
      <MagicLinkForm ssoDomains={ssoDomains} />

      <AuthNote className={styles.note}>
        <strong>Voor het eerst hier?</strong> Je organisatie stuurt je een uitnodiging per e-mail. Logt je organisatie
        in met Microsoft of Google, dan kun je ook direct met dat account verder.
      </AuthNote>
    </AuthCard>
  );
}
