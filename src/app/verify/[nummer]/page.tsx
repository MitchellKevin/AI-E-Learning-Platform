import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Check, SearchX } from "lucide-react";
import { getCertificateNumbers, verifyCertificate } from "@/lib/data/profile";
import { allChapters } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { VerifyLookup } from "@/components/profile/verify-lookup";
import styles from "../verify.module.scss";

type Params = { params: Promise<{ nummer: string }> };

// Bekende nummers vooraf renderen; onbekende nummers worden op aanvraag gecontroleerd.
export async function generateStaticParams() {
  return (await getCertificateNumbers()).map((nummer) => ({ nummer }));
}

// Een ingetrokken certificaat moet snel ongeldig worden.
export const revalidate = 3600;

function readNumber(raw: string) {
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // Ongeldige codering: toon wat er staat.
  }
  return value.trim().slice(0, 64);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const number = readNumber((await params).nummer);
  const result = await verifyCertificate(number);
  return {
    title: result ? `Certificaat ${result.certificate.number} is geldig · AI Academy` : "Certificaat niet gevonden · AI Academy",
    description: result
      ? `${result.holder.firstName} ${result.holder.lastName} heeft het leerpad ${result.path.title} van AI Academy afgerond.`
      : undefined,
    robots: { index: false },
  };
}

export default async function VerifyPage({ params }: Params) {
  const number = readNumber((await params).nummer);
  const result = await verifyCertificate(number);

  if (!result) {
    return (
      <main className={styles.main}>
        <article className={styles.card} aria-labelledby="verify-title">
          <div className={styles.status}>
            <span className={`${styles.statusIcon} ${styles.invalid}`} aria-hidden>
              <SearchX />
            </span>
            <p className={`${styles.eyebrow} ${styles.invalidText}`}>Niet gevonden</p>
            <h1 id="verify-title" className={styles.title}>
              We kunnen dit certificaat niet vinden
            </h1>
            <p className={styles.lead}>
              AI Academy heeft geen certificaat uitgegeven met nummer{" "}
              <span className={styles.mono}>{number || "(leeg)"}</span>.
            </p>
          </div>

          <div className={styles.body}>
            <h2 className={styles.subTitle}>Wat je kunt doen</h2>
            <ul className={styles.checks}>
              <li>
                Controleer of het nummer goed is overgenomen. Het ziet eruit als{" "}
                <span className={styles.mono}>AIA-101-2026-0482</span>.
              </li>
              <li>Heb je een link gekregen? Gebruik dan de volledige link van de houder van het certificaat.</li>
              <li>
                Twijfel je nog? <Link href="/help">Neem contact op met support</Link>, dan zoeken we het voor je uit.
              </li>
            </ul>
          </div>

          <div className={styles.lookup}>
            <VerifyLookup defaultValue={number} />
          </div>
        </article>
      </main>
    );
  }

  const { certificate, holder, path } = result;
  const fullName = `${holder.firstName} ${holder.lastName}`;

  return (
    <main className={styles.main}>
      <article className={styles.card} aria-labelledby="verify-title">
        <div className={styles.status}>
          <span className={`${styles.statusIcon} ${styles.valid}`} aria-hidden>
            <Check strokeWidth={2.5} />
          </span>
          <p className={`${styles.eyebrow} ${styles.validText}`}>Geverifieerd</p>
          <h1 id="verify-title" className={styles.title}>
            Dit certificaat is geldig
          </h1>
          <p className={styles.lead}>
            AI Academy bevestigt dat dit certificaat is uitgegeven aan <strong>{fullName}</strong>.
          </p>
        </div>

        <dl className={styles.facts}>
          <div>
            <dt>Houder</dt>
            <dd>{fullName}</dd>
          </div>
          <div>
            <dt>Leerpad</dt>
            <dd>{path.title}</dd>
          </div>
          <div>
            <dt>Uitgegeven op</dt>
            <dd>{formatDate(certificate.issuedAt)}</dd>
          </div>
          <div>
            <dt>Eindtoets</dt>
            <dd>{certificate.score}%</dd>
          </div>
          <div>
            <dt>Uitgegeven door</dt>
            <dd className={styles.issuer}>
              <BadgeCheck aria-hidden />
              AI Academy
            </dd>
          </div>
          <div>
            <dt>Certificaatnummer</dt>
            <dd className={styles.mono}>{certificate.number}</dd>
          </div>
        </dl>

        <div className={styles.body}>
          <h2 className={styles.subTitle}>Wat dit certificaat betekent</h2>
          <p className={styles.text}>
            {fullName} heeft het leerpad {path.title} ({allChapters(path).length} hoofdstukken, circa {path.hours} uur)
            met succes afgerond en {path.certificateText}
          </p>
          <ul className={styles.goals}>
            {path.learningGoals.map((goal) => (
              <li key={goal}>
                <Check aria-hidden />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </main>
  );
}
