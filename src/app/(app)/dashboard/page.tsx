import Link from "next/link";
import clsx from "clsx";
import { completedTaskCount, getLearningPath, getLearningPaths, pathProgress } from "@/lib/content";
import { getBadges, getCurrentUser, getLeaderboard, getProgress, getStats } from "@/lib/user-data";
import { formatNumber, formatToday } from "@/lib/format";
import { ArrowButton, Avatar, Card, Eyebrow, ProgressBar, Tag, Tags } from "@/components/ui";
import { CountUp } from "@/components/count-up";
import { WeekChart } from "@/components/week-chart";
import styles from "./page.module.scss";

// Datum en (straks) gebruikersdata per request renderen.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [user, stats, progress, paths, ai101, leaderboard, { badges, total }] = await Promise.all([
    getCurrentUser(),
    getStats(),
    getProgress(),
    getLearningPaths(),
    getLearningPath("ai-101"),
    getLeaderboard(),
    getBadges(),
  ]);

  const base = pathProgress(progress, ai101!);
  const current = base.current;
  const currentTopicIndex = current ? ai101!.topics.findIndex((t) => t.chapters.includes(current)) : -1;
  const tasksDone = current ? completedTaskCount(progress, current) : 0;

  const statItems = [
    { value: <CountUp value={stats.streak} />, label: "Dagen streak", accent: true },
    { value: <CountUp value={stats.points} />, label: "Punten" },
    { value: `#${stats.teamRank}`, label: "Rang in je team" },
    { value: <CountUp value={base.done} suffix={`/${base.total}`} />, label: "Hoofdstukken" },
  ];

  return (
    <main className={styles.main}>
      <section className={styles.intro}>
        <div className={styles.introText}>
          <p className={styles.date}>{formatToday()}</p>
          <h1 className={styles.title}>Welkom terug, {user.firstName}</h1>
          <p className={styles.lead}>
            Je bent {base.percent}% door {ai101!.title}. Rond nog {base.topicsLeft} onderwerpen af om te
            kiezen tussen het designer- en het developerpad.
          </p>
        </div>
        <Card className={styles.stats}>
          {statItems.map((s) => (
            <div key={s.label} className={styles.stat}>
              <p className={clsx(styles.statValue, s.accent && styles.accent)}>{s.value}</p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </Card>
      </section>

      <div className={styles.grid}>
        <div className={styles.content}>
          {current && (
            <Card className={styles.resume}>
              <ProgressBar value={(tasksDone / current.tasks.length) * 100} className={styles.resumeProgress} />
              <div className={styles.resumeBody}>
                <div>
                  <Eyebrow className={styles.resumeEyebrow}>
                    Verder waar je gebleven was · {ai101!.title} · Onderwerp {currentTopicIndex + 1}
                  </Eyebrow>
                  <h2 className={styles.resumeTitle}>{current.title}</h2>
                  <p className={styles.resumeText}>
                    Hoofdstuk {current.number} uit {ai101!.topics[currentTopicIndex].title}. Je hebt{" "}
                    {tasksDone} van de {current.tasks.length} taken afgerond.
                  </p>
                  <Tags>
                    <Tag variant="brand">{current.level}</Tag>
                    <Tag>25 min</Tag>
                    <Tag>+{current.points} punten</Tag>
                  </Tags>
                </div>
                <ArrowButton href={`/leerpaden/${ai101!.slug}/${current.slug}`}>Ga verder</ArrowButton>
              </div>
            </Card>
          )}

          <section>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Jouw leerpaden</h2>
              <Link href="/leerpaden" className={styles.link}>
                Alle leerpaden
              </Link>
            </div>
            <div className={styles.paths}>
              {paths.map((path) => {
                const p = pathProgress(progress, path);
                return (
                  <Link key={path.slug} href={`/leerpaden/${path.slug}`} className={styles.pathLink}>
                    <Card className={clsx(styles.pathCard, p.started && styles.started)}>
                      <div className={styles.pathMeta}>
                        <span className={styles.pathStatus}>{p.started ? "Bezig" : "Na AI 101"}</span>
                        <span>{path.topics.length} onderwerpen</span>
                      </div>
                      <h3 className={styles.pathTitle}>{path.title}</h3>
                      <p className={styles.pathText}>{path.shortDescription}</p>
                      <ProgressBar value={p.percent} />
                      <p className={styles.pathFoot}>
                        {p.started ? `${p.done} van ${p.total} hoofdstukken` : "Nog niet gestart"}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Deze week</h2>
            <Card className={styles.weekCard}>
              <WeekChart minutes={stats.weekMinutes} goal={stats.weekGoal} />
            </Card>
          </section>
        </div>

        <aside className={styles.aside}>
          <Card className={styles.sideCard}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Leaderboard</h2>
              <Eyebrow>Deze maand</Eyebrow>
            </div>
            <ol className={styles.leaderboard}>
              {leaderboard.map((entry, i) => (
                <li
                  key={entry.rank}
                  className={clsx(styles.entry, entry.isMe && styles.me)}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className={clsx(styles.rank, (entry.rank <= 3 || entry.isMe) && styles.highlight)}>
                    {entry.rank}
                  </span>
                  <Avatar initials={entry.initials} size={24} />
                  <span className={styles.name}>
                    {entry.name}
                    {entry.isMe && " (jij)"}
                  </span>
                  <span className={styles.points}>{formatNumber(entry.points)}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className={styles.sideCard}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Badges</h2>
              <span className={styles.sideMeta}>
                {badges.filter((b) => b.earned).length} van {total}
              </span>
            </div>
            <ul className={styles.badges}>
              {badges.map((badge, i) => (
                <li
                  key={badge.code}
                  className={clsx(styles.badge, badge.earned && styles.earned)}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className={styles.badgeIcon}>{badge.code}</span>
                  <span className={styles.badgeLabel}>{badge.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </main>
  );
}
