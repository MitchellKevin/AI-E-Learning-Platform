import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { Award, BadgeCheck, ArrowRight } from "lucide-react";
import { allChapters, getLearningPath, getLearningPaths, pathProgress } from "@/lib/content";
import { getCertificates, getCurrentUser, getProgress } from "@/lib/user-data";
import { formatDate } from "@/lib/format";
import { Breadcrumbs, Card, Eyebrow } from "@/components/ui";
import { ShareActions } from "@/components/share-actions";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ path: string }> }) {
  const { path: slug } = await params;
  const [path, paths, user, certificates, progress] = await Promise.all([
    getLearningPath(slug),
    getLearningPaths(),
    getCurrentUser(),
    getCertificates(),
    getProgress(),
  ]);
  const certificate = certificates.find((c) => c.pathSlug === slug);
  if (!path || !certificate) notFound();

  const fullName = `${user.firstName} ${user.lastName}`;
  const hasSpecialisations = paths.some((p) => p.prerequisite === path.slug);

  return (
    <main className={styles.main}>
      <div className={styles.intro}>
        <Breadcrumbs items={[{ label: "Profiel" }, { label: "Certificaten" }]} />
        <h1 className={styles.title}>Je certificaat {path.title}</h1>
        <p className={styles.lead}>
          Gefeliciteerd, je hebt {hasSpecialisations ? "de gezamenlijke basis" : "dit leerpad"} afgerond.
          Download je certificaat of deel het met je netwerk.
        </p>
      </div>

      <div className={styles.grid}>
        <Card className={styles.frame}>
          <article className={styles.certificate} aria-label={`Certificaat ${path.title}`}>
            <div className={styles.ring} aria-hidden />
            <p className={styles.logo}>
              <span>AI</span> Academy
            </p>
            <Eyebrow className={styles.kicker}>Certificaat van voltooiing</Eyebrow>
            <p className={styles.declare}>Hierbij verklaren wij dat</p>
            <p className={styles.name}>{fullName}</p>
            <p className={styles.statement}>
              het leerpad <strong>{path.title}</strong> met succes heeft afgerond en {path.certificateText}
            </p>
            <dl className={styles.facts}>
              <div>
                <dt>Datum</dt>
                <dd>{formatDate(certificate.issuedAt)}</dd>
              </div>
              <div>
                <dt>Eindtoets</dt>
                <dd>{certificate.score}%</dd>
              </div>
              <div>
                <dt>Studielast</dt>
                <dd>
                  {allChapters(path).length} hoofdstukken · circa {path.hours} uur
                </dd>
              </div>
            </dl>
            <div className={styles.footer}>
              <div className={styles.signature}>
                <p>[Handtekening]</p>
                <span>[Naam opleidingscoördinator]</span>
              </div>
              <div className={styles.number}>
                <span className={styles.seal}>
                  <BadgeCheck />
                </span>
                <dl>
                  <dt>Certificaatnummer</dt>
                  <dd>{certificate.number}</dd>
                </dl>
              </div>
            </div>
          </article>
        </Card>

        <aside className={styles.aside}>
          <Card className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Delen en downloaden</h2>
            <ShareActions certificateNumber={certificate.number} pathTitle={path.title} issuedAt={certificate.issuedAt} />
          </Card>

          <Card className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Al je certificaten</h2>
            <ul className={styles.list}>
              {paths.map((p) => {
                const cert = certificates.find((c) => c.pathSlug === p.slug);
                const started = pathProgress(progress, p).started;
                const content = (
                  <>
                    <span className={clsx(styles.listIcon, cert && styles.earned)}>
                      <Award />
                    </span>
                    <span>
                      <strong>{p.title}</strong>
                      <small>
                        {cert ? `Behaald op ${formatDate(cert.issuedAt)}` : started ? "Bezig" : "Nog niet gestart"}
                      </small>
                    </span>
                  </>
                );
                return (
                  <li key={p.slug}>
                    {cert ? (
                      <Link href={`/profiel/certificaten/${p.slug}`} className={styles.listItem}>
                        {content}
                      </Link>
                    ) : (
                      <div className={styles.listItem}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {hasSpecialisations && (
            <Link href="/leerpaden/kies" className={styles.next}>
              <span>
                <Eyebrow className={styles.nextEyebrow}>Volgende stap</Eyebrow>
                <strong>Kies je specialisatie</strong>
              </span>
              <ArrowRight />
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
