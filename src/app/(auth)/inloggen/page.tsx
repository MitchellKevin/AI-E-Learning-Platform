import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Alert } from "@/components/kit";
import { AuthCard, AuthDivider, AuthNote } from "@/components/auth/auth-card";
import { SsoButtons } from "@/components/auth/sso-buttons";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { getSsoDomains } from "@/lib/data/auth";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Inloggen – AI Academy",
};

// Meldingen als je via een oude of ongeldige link hier terugkomt (?fout=…).
const errors: Record<string, { title: string; body: string }> = {
  verlopen: {
    title: "Deze inloglink is verlopen",
    body: "Inloglinks zijn 15 minuten geldig. Vraag hieronder een nieuwe aan.",
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

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ fout?: string }> }) {
  const [{ fout }, ssoDomains] = await Promise.all([searchParams, getSsoDomains()]);
  const error = fout ? errors[fout] : undefined;

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
          <Link href="/dashboard" className={styles.demo}>
            Bekijk demo-omgeving
            <ArrowRight aria-hidden />
          </Link>
        </>
      }
    >
      {error && (
        <Alert variant="warning" title={error.title} live>
          {error.body}
        </Alert>
      )}

      <SsoButtons next="/dashboard" />
      <AuthDivider>of met e-mail</AuthDivider>
      <MagicLinkForm ssoDomains={ssoDomains} />

      <AuthNote className={styles.note}>
        <strong>Voor het eerst hier?</strong> Je organisatie stuurt je een uitnodiging per e-mail. Logt je organisatie
        in met Microsoft of Google, dan kun je ook direct met dat account verder.
      </AuthNote>
    </AuthCard>
  );
}
