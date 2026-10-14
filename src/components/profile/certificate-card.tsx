import Link from "next/link";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import type { Certificate, LearningPath } from "@/lib/types";
import { formatDate } from "@/lib/format";
import styles from "./certificate-card.module.scss";

type Props = { certificate: Certificate; path: LearningPath; holder: string };

// Mini-certificaat. De hele kaart linkt naar het certificaat; de verificatielink ligt erboven.
export function CertificateCard({ certificate, path, holder }: Props) {
  return (
    <article className={styles.card}>
      <span className={styles.ringClip} aria-hidden>
        <span className={styles.ring} />
      </span>
      <div className={styles.frame}>
        <div className={styles.top}>
          <p className={styles.logo}>
            <span>AI</span> Academy
          </p>
          <span className={styles.seal} aria-hidden>
            <BadgeCheck />
          </span>
        </div>
        <p className={styles.kicker}>Certificaat van voltooiing</p>
        <h3 className={styles.title}>
          <Link href={`/profiel/certificaten/${path.slug}`} className={styles.link}>
            {path.title}
          </Link>
        </h3>
        <p className={styles.holder}>{holder}</p>
        <dl className={styles.facts}>
          <div>
            <dt>Behaald op</dt>
            <dd>{formatDate(certificate.issuedAt)}</dd>
          </div>
          <div>
            <dt>Eindtoets</dt>
            <dd>{certificate.score}%</dd>
          </div>
          <div className={styles.number}>
            <dt>Nummer</dt>
            <dd>{certificate.number}</dd>
          </div>
        </dl>
      </div>
      <div className={styles.footer}>
        <span className={styles.open} aria-hidden>
          Bekijk en deel
        </span>
        <Link href={`/verify/${certificate.number}`} className={styles.verify}>
          <ShieldCheck aria-hidden />
          Openbare verificatie
        </Link>
      </div>
    </article>
  );
}
