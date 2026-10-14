import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { Award, Briefcase, CalendarDays, ChevronRight, EyeOff, Settings, Trophy, Users } from "lucide-react";
import { allChapters, getLearningPaths, isChapterDone } from "@/lib/content";
import { getCertificates, getCurrentUser, getProgress, getStats } from "@/lib/user-data";
import { getActivity, getBadgeCatalog, getProfile, getSettings } from "@/lib/data/profile";
import { formatDate, formatNumber } from "@/lib/format";
import { Avatar, Button, Card, EmptyState, Section, Stat, StatGroup } from "@/components/kit";
import { CountUp } from "@/components/count-up";
import { ActivityTimeline } from "@/components/profile/activity-timeline";
import { BadgeGrid } from "@/components/profile/badge-grid";
import { PathProgressList } from "@/components/profile/path-progress-list";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Profiel · AI Academy" };

// Activiteit ("Vandaag", "Gisteren") en straks gebruikersdata per request renderen.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [user, profile, stats, progress, paths, certificates, badges, activity, settings] = await Promise.all([
    getCurrentUser(),
    getProfile(),
    getStats(),
    getProgress(),
    getLearningPaths(),
    getCertificates(),
    getBadgeCatalog(),
    getActivity(6),
    getSettings(),
  ]);

  const fullName = `${user.firstName} ${user.lastName}`;
  const chapters = paths.flatMap(allChapters);
  const chaptersDone = chapters.filter((c) => isChapterDone(progress, c)).length;
  const earnedBadges = badges.filter((b) => b.earned).length;

  return (
    <main>
      <section className={styles.hero} aria-labelledby="profile-title">
        <div className={styles.heroInner}>
          <div className={styles.identity}>
            <span className={styles.avatar}>
              <Avatar initials={user.initials} size={88} />
            </span>
            <div className={styles.identityText}>
              <p className={styles.eyebrow}>Profiel</p>
              <h1 id="profile-title" className={styles.title}>
                {fullName}
              </h1>
              <ul className={styles.meta}>
                <li>
                  <Briefcase aria-hidden />
                  {profile.jobTitle}
                </li>
                <li>
                  <Users aria-hidden />
                  Team {profile.team} · {profile.organisation}
                </li>
                <li>
                  <CalendarDays aria-hidden />
                  Lid sinds {formatDate(profile.memberSince)}
                </li>
              </ul>
            </div>
          </div>
          <div className={styles.actions}>
            <Button href="/instellingen" variant="secondary" icon={<Settings />}>
              Instellingen
            </Button>
            <Button href="/profiel/certificaten" icon={<Award />}>
              Certificaten
            </Button>
          </div>
        </div>
      </section>

      <div className={styles.content}>
        <StatGroup columns={4} className={styles.stats}>
          <Stat
            value={<CountUp value={stats.points} />}
            label="Punten"
            hint={`#${stats.teamRank} in team ${profile.team}`}
          />
          <Stat
            value={<CountUp value={stats.streak} />}
            label="Dagen streak"
            accent
            hint={`Langste streak: ${profile.longestStreak} dagen`}
          />
          <Stat
            value={<CountUp value={chaptersDone} />}
            label="Hoofdstukken afgerond"
            hint={`Van ${chapters.length} in alle leerpaden`}
          />
          <Stat
            value={<CountUp value={certificates.length} />}
            label={certificates.length === 1 ? "Certificaat" : "Certificaten"}
            hint={`${earnedBadges} van ${badges.length} badges`}
          />
        </StatGroup>

        <div className={styles.grid}>
          <div className={styles.main}>
            <Section title="Leerpaden" link={{ href: "/leerpaden", label: "Alle leerpaden" }}>
              <PathProgressList paths={paths} progress={progress} certificates={certificates} />
            </Section>

            <Section title="Recente activiteit" description="Wat je de afgelopen dagen hebt gedaan.">
              {activity.length > 0 ? (
                <ActivityTimeline items={activity} />
              ) : (
                <EmptyState icon={<CalendarDays />} title="Nog geen activiteit" variant="card">
                  Zodra je een hoofdstuk, quiz of oefening afrondt, zie je dat hier terug.
                </EmptyState>
              )}
            </Section>
          </div>

          <aside className={styles.aside} aria-label="Snelkoppelingen">
            <Card className={styles.sideCard}>
              <div className={styles.sideHead}>
                <h2 className={styles.sideTitle}>Certificaten</h2>
                <span className={styles.sideMeta}>{certificates.length} behaald</span>
              </div>
              {certificates.length > 0 ? (
                <ul className={styles.certList}>
                  {certificates.map((c) => {
                    const path = paths.find((p) => p.slug === c.pathSlug);
                    return (
                      <li key={c.number}>
                        <Link href={`/profiel/certificaten/${c.pathSlug}`} className={styles.certItem}>
                          <span className={styles.certIcon} aria-hidden>
                            <Award />
                          </span>
                          <span className={styles.certText}>
                            <strong>{path?.title ?? c.pathSlug}</strong>
                            <small>
                              {formatDate(c.issuedAt)} · {c.score}%
                            </small>
                          </span>
                          <ChevronRight className={styles.certChevron} aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={styles.sideText}>Rond een leerpad en de eindtoets af om je eerste certificaat te halen.</p>
              )}
              <Link href="/profiel/certificaten" className={styles.sideLink}>
                Alle certificaten
              </Link>
            </Card>

            <Card className={styles.sideCard}>
              <div className={styles.sideHead}>
                <h2 className={styles.sideTitle}>Zichtbaarheid</h2>
              </div>
              <p className={clsx(styles.visibility, !settings.privacy.showOnLeaderboard && styles.hidden)}>
                {settings.privacy.showOnLeaderboard ? <Trophy aria-hidden /> : <EyeOff aria-hidden />}
                <span>
                  {settings.privacy.showOnLeaderboard
                    ? `Je staat op het leaderboard van team ${profile.team} met ${formatNumber(stats.points)} punten.`
                    : "Je staat niet op het leaderboard. Je punten en badges tellen wel gewoon mee."}
                </span>
              </p>
              <Link href="/instellingen/privacy" className={styles.sideLink}>
                Privacy-instellingen
              </Link>
            </Card>
          </aside>
        </div>

        <Section
          id="badges"
          title="Badges"
          description={`${earnedBadges} van ${badges.length} behaald. Zo verdien je de rest.`}
          className={styles.badges}
        >
          <BadgeGrid badges={badges} />
        </Section>
      </div>
    </main>
  );
}
