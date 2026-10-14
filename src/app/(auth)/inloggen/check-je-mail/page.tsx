import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MailCheck } from "lucide-react";
import { Button } from "@/components/kit";
import { AuthCard, AuthNote } from "@/components/auth/auth-card";
import { ResendLink } from "@/components/auth/resend-link";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Check je mail – AI Academy",
};

const mailApps = [
  { label: "Outlook", href: "https://outlook.office.com/mail/" },
  { label: "Gmail", href: "https://mail.google.com/" },
];

export default async function CheckMailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email: raw } = await searchParams;
  // Alleen een redelijk e-mailadres tonen; de rest is waarschijnlijk een kapotte link.
  const email = raw && raw.length <= 254 && raw.includes("@") ? raw : undefined;

  return (
    <AuthCard
      icon={<MailCheck />}
      tone="success"
      title="Check je mail"
      lead={
        <>
          We hebben een inloglink gestuurd naar {email ? <strong>{email}</strong> : "je e-mailadres"}. Klik op de link
          in de mail om in te loggen. De link is 15 minuten geldig.
        </>
      }
      after={
        <p>
          Verkeerd e-mailadres? <Link href="/inloggen">Gebruik een ander adres</Link>
        </p>
      }
    >
      <div className={styles.apps}>
        {mailApps.map((app) => (
          <Button
            key={app.label}
            href={app.href}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="sm"
            iconRight={<ExternalLink />}
          >
            Open {app.label}
            <span className="visually-hidden"> (opent in een nieuw tabblad)</span>
          </Button>
        ))}
      </div>

      <div className={styles.help}>
        <h2 className={styles.helpTitle}>Geen mail ontvangen?</h2>
        <ul className={styles.tips}>
          <li>Kijk in je map met ongewenste e-mail of zoek op &ldquo;AI Academy&rdquo;.</li>
          <li>Open de link in dezelfde browser als waarin je deze pagina ziet.</li>
          <li>Werkt je organisatie met een beveiligd mailfilter? Dan kan het een paar minuten duren.</li>
        </ul>
        <ResendLink email={email} />
      </div>

      <AuthNote>
        Lukt het nog steeds niet? Bekijk <Link href="/help">het helpcenter</Link> of vraag je beheerder om hulp.
      </AuthNote>
    </AuthCard>
  );
}
