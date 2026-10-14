import type { Metadata } from "next";
import clsx from "clsx";
import { Award, Lock } from "lucide-react";
import { getLearningPaths, pathProgress } from "@/lib/content";
import { getCertificates, getCurrentUser, getProgress } from "@/lib/user-data";
import { Button, EmptyState, PageHeader, ProgressBar, Section, Tag, Tags } from "@/components/kit";
import { CertificateCard } from "@/components/profile/certificate-card";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Certificaten · AI Academy" };

export default async function CertificatesPage() {
  const [user, paths, certificates, progress] = await Promise.all([
    getCurrentUser(),
    getLearningPaths(),
    getCertificates(),
    getProgress(),
  ]);

  const holder = `${user.firstName} ${user.lastName}`;
  const earned = certificates
    .map((certificate) => ({ certificate, path: paths.find((p) => p.slug === certificate.pathSlug) }))
    .filter((x): x is { certificate: (typeof certificates)[number]; path: NonNullable<typeof x.path> } => Boolean(x.path))
    .sort((a, b) => b.certificate.issuedAt.localeCompare(a.certificate.issuedAt));

  const hasCertificate = (slug: string) => certificates.some((c) => c.pathSlug === slug);
  // Bezig eerst, dan nog niet gestart; vergrendelde paden achteraan.
  const upcoming = paths
    .filter((p) => !hasCertificate(p.slug))
    .map((path) => {
      const p = pathProgress(progress, path);
      const prerequisite = paths.find((x) => x.slug === path.prerequisite);
      const locked = Boolean(prerequisite && !hasCertificate(prerequisite.slug) && pathProgress(progress, prerequisite).percent < 100);
      return { path, p, prerequisite, locked };
    })
    .sort((a, b) => Number(a.locked) - Number(b.locked) || b.p.percent - a.p.percent);

  return (
    <main>
      <PageHeader
        band
        size="lg"
        breadcrumbs={[{ label: "Profiel", href: "/profiel" }, { label: "Certificaten" }]}
        title="Certificaten"
        lead="Je behaalde certificaten en de leerpaden waarmee je er nog een kunt halen. Elk certificaat heeft een openbare link waarmee anderen kunnen controleren dat het echt is."
      />

      <div className={styles.content}>
        <Section
          title="Behaald"
          description={
            earned.length > 0
              ? `${earned.length} ${earned.length === 1 ? "certificaat" : "certificaten"} op naam van ${holder}.`
              : undefined
          }
        >
          {earned.length > 0 ? (
            <ul className={styles.earned}>
              {earned.map(({ certificate, path }) => (
                <li key={certificate.number}>
                  <CertificateCard certificate={certificate} path={path} holder={holder} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Award />}
              title="Nog geen certificaten"
              action={<Button href="/leerpaden">Bekijk leerpaden</Button>}
            >
              Rond een leerpad af en haal de eindtoets. Je certificaat verschijnt dan direct hier.
            </EmptyState>
          )}
        </Section>

        {upcoming.length > 0 && (
          <Section
            title="Nog te behalen"
            description="Rond alle hoofdstukken af en haal de eindtoets. Je certificaat staat daarna direct klaar."
            className={styles.upcomingSection}
          >
            <ul className={styles.upcoming}>
              {upcoming.map(({ path, p, prerequisite, locked }) => (
                <li key={path.slug} className={clsx(styles.upcomingItem, locked && styles.locked)}>
                  <div className={styles.upcomingHead}>
                    <span className={styles.upcomingIcon} aria-hidden>
                      {locked ? <Lock /> : <Award />}
                    </span>
                    <span className={styles.upcomingStatus}>
                      {locked && prerequisite
                        ? `Na ${prerequisite.title}`
                        : p.started
                          ? "Bezig"
                          : "Nog niet gestart"}
                    </span>
                  </div>
                  <h3 className={styles.upcomingTitle}>{path.title}</h3>
                  <p className={styles.upcomingText}>{path.shortDescription}</p>
                  <Tags>
                    {path.audience && <Tag variant="brand">{path.audience}</Tag>}
                    <Tag>Circa {path.hours} uur</Tag>
                  </Tags>
                  <div className={styles.upcomingProgress}>
                    <ProgressBar value={p.percent} />
                    <p>
                      <span>
                        {p.done} van {p.total} hoofdstukken
                      </span>
                      <span className={styles.percent}>{p.percent}%</span>
                    </p>
                  </div>
                  <div className={styles.upcomingAction}>
                    {locked && prerequisite ? (
                      <Button href={`/leerpaden/${prerequisite.slug}`} variant="secondary" size="sm" fullWidth>
                        Eerst {prerequisite.title} afronden
                      </Button>
                    ) : p.started && p.current ? (
                      <Button href={`/leerpaden/${path.slug}/${p.current.slug}`} size="sm" fullWidth>
                        Verder met {p.current.number}
                      </Button>
                    ) : (
                      <Button href={`/leerpaden/${path.slug}`} variant="secondary" size="sm" fullWidth>
                        Bekijk leerpad
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </main>
  );
}
