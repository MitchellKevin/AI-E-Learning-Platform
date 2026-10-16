import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, BarChart3, CalendarClock, PartyPopper, Plus } from "lucide-react";
import { getOverview } from "@/lib/data/admin-team";
import { formatNumber } from "@/lib/format";
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, ProgressBar, Section, Stat, StatusPill } from "@/components/kit";
import { CountUp } from "@/components/count-up";
import { ColumnChart } from "@/components/admin/team/charts/column-chart";
import { StackedBar, StackLegend, type StackSegment } from "@/components/admin/team/charts/stacked-bar";
import { RemindButton } from "@/components/admin/team/remind-button";
import { formatDaysLeft, formatLongDate, formatShortDate, plural } from "@/components/admin/shell/format";
import styles from "./page.module.scss";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Overzicht · Beheer · AI Academy" };

const ATTENTION_LIMIT = 5;

const attentionLabel = { inactief: "Inactief", achter: "Achter op schema", uitnodiging: "Uitnodiging open" };
const attentionVariant = { inactief: "danger", achter: "warning", uitnodiging: "neutral" } as const;

export default async function AdminOverviewPage() {
  const [{ today, kpis, pathBreakdown, weekly, attention, deadlines }, user] = await Promise.all([getOverview(), requireRole("manager")]);
  const isAdmin = user.role === "admin";

  const lastWeek = weekly[weekly.length - 1];
  const peakWeek = weekly.reduce((best, w) => (w.minutes > best.minutes ? w : best), weekly[0]);
  const seatsPercent = Math.round((kpis.seatsUsed / kpis.seats) * 100);

  return (
    <>
      <PageHeader
        eyebrow={formatLongDate(today)}
        title="Overzicht"
        lead={`${kpis.activeLearners} van de ${kpis.joinedLearners} collega's leerden de afgelopen twee weken. ${
          attention.length > 0 ? `${plural(attention.length, "collega heeft", "collega's hebben")} je aandacht nodig.` : "Iedereen ligt op schema."
        }`}
        actions={
          <>
            <Button href="/beheer/rapportages" variant="secondary" icon={<BarChart3 />}>
              Rapportages
            </Button>
            <Button href="/beheer/toewijzingen?nieuw=1" icon={<Plus />}>
              Nieuwe toewijzing
            </Button>
          </>
        }
      />

      <section aria-label="Kerncijfers" className={styles.kpis}>
        <Card className={styles.kpi}>
          <Stat
            value={<CountUp value={kpis.activeLearners} />}
            label="Actieve cursisten"
            hint={`van ${kpis.joinedLearners} collega's · laatste 14 dagen`}
            accent
          />
        </Card>
        <Card className={styles.kpi}>
          <Stat
            value={<CountUp value={kpis.aiProgress} suffix="%" />}
            label="Gem. voortgang AI 101"
            hint={`${kpis.aiCompleted} van ${kpis.aiAssigned} afgerond`}
          />
        </Card>
        <Card className={styles.kpi}>
          <Stat
            value={<CountUp value={kpis.certificates} />}
            label="Certificaten behaald"
            trend={
              kpis.certificatesLastMonth > 0
                ? { value: `+${kpis.certificatesLastMonth}`, direction: "up", label: "laatste 30 dagen" }
                : { value: "0", direction: "flat", label: "laatste 30 dagen" }
            }
          />
        </Card>
        <Card className={styles.kpi}>
          <Stat
            value={<CountUp value={kpis.minutesPerWeek} />}
            label="Gem. minuten per week"
            hint="per actieve collega · advies 60"
          />
        </Card>
        <Card className={clsx(styles.kpi, styles.seats)}>
          <Stat
            value={
              <>
                {kpis.seatsUsed}
                <span className={styles.of}>/{kpis.seats}</span>
              </>
            }
            label="Licenties in gebruik"
          />
          <ProgressBar value={seatsPercent} className={styles.seatsBar} />
          {isAdmin ? (
            <Link href="/beheer/abonnement" className={styles.kpiLink}>
              {kpis.seats - kpis.seatsUsed} vrij · beheer licenties
            </Link>
          ) : (
            <span className={styles.kpiLink}>{kpis.seats - kpis.seatsUsed} vrij</span>
          )}
        </Card>
      </section>

      <div className={styles.grid}>
        <div className={styles.column}>
          <Section
            title="Voortgang per leerpad"
            description="Iedereen die het pad toegewezen kreeg of zelf startte."
            link={{ href: "/beheer/rapportages", label: "Naar rapportages" }}
          >
            <Card className={styles.paths}>
              {pathBreakdown.map((path, i) => {
                const segments: StackSegment[] = [
                  { label: "Afgerond", value: path.afgerond, tone: "done" },
                  { label: "Bezig", value: path.bezig, tone: "active" },
                  { label: "Niet gestart", value: path.nietGestart, tone: "todo" },
                ];
                return (
                  <div key={path.slug} className={styles.pathRow}>
                    <div className={styles.pathHead}>
                      <h3 className={styles.pathTitle}>{path.title}</h3>
                      <span className={styles.pathMeta}>
                        {plural(path.total, "collega", "collega's")} ·{" "}
                        {Math.round((path.afgerond / path.total) * 100)}% afgerond
                      </span>
                    </div>
                    <StackedBar
                      index={i}
                      label={`${path.title}: ${segments.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(", ")}`}
                      segments={segments}
                    />
                    <StackLegend segments={segments} />
                  </div>
                );
              })}
            </Card>
          </Section>

          <Section
            title="Activiteit"
            description="Leertijd van het hele team per week, afgelopen 8 weken."
          >
            <Card className={styles.chartCard}>
              <ColumnChart
                label="Leertijd per week in minuten"
                valueLabel="Leertijd"
                unit="min"
                points={weekly.map((w) => ({
                  key: `w${w.week}`,
                  label: `wk ${w.week}`,
                  fullLabel: `Week ${w.week} (vanaf ${formatShortDate(w.start)}) · ${w.activeLearners} actief`,
                  value: w.minutes,
                }))}
                caption={
                  <>
                    Vorige week leerden {lastWeek.activeLearners} collega&apos;s samen{" "}
                    <strong>{formatNumber(lastWeek.minutes)} minuten</strong>. De piek lag in week {peakWeek.week}, vlak
                    na de start van de AI 101-toewijzingen.
                  </>
                }
              />
            </Card>
          </Section>
        </div>

        <div className={styles.column}>
          <Section
            title={
              <span className={styles.titleWithCount}>
                Aandacht nodig
                {attention.length > 0 && (
                  <Badge variant="warning" size="sm">
                    {attention.length}
                  </Badge>
                )}
              </span>
            }
            link={{ href: "/beheer/team", label: "Hele team" }}
          >
            {attention.length === 0 ? (
              <EmptyState icon={<PartyPopper />} title="Niemand loopt achter" variant="card">
                Iedereen is de afgelopen twee weken actief geweest en ligt op schema.
              </EmptyState>
            ) : (
              <Card className={styles.listCard}>
                <ul className={styles.attention}>
                  {attention.slice(0, ATTENTION_LIMIT).map((item) => (
                    <li key={item.member.id} className={styles.attentionItem}>
                      <Avatar initials={item.member.initials} size={36} />
                      <div className={styles.attentionText}>
                        <p className={styles.attentionName}>
                          {item.member.name}
                          <span className={styles.attentionTeam}> · {item.member.team}</span>
                        </p>
                        <p className={styles.attentionTitle}>
                          <StatusPill variant={attentionVariant[item.kind]} size="sm">
                            {attentionLabel[item.kind]}
                          </StatusPill>
                          <span>{item.title}</span>
                        </p>
                        <p className={styles.attentionDetail}>{item.detail}</p>
                      </div>
                      <RemindButton
                        ids={[item.member.id]}
                        names={[item.member.name]}
                        label={item.kind === "uitnodiging" ? "Opnieuw uitnodigen" : "Stuur herinnering"}
                        className={styles.attentionAction}
                      />
                    </li>
                  ))}
                </ul>
                {attention.length > ATTENTION_LIMIT && (
                  <Link href="/beheer/team" className={styles.cardFooterLink}>
                    Nog {plural(attention.length - ATTENTION_LIMIT, "collega", "collega's")} in het teamoverzicht
                    <ArrowRight aria-hidden />
                  </Link>
                )}
              </Card>
            )}
          </Section>

          <Section title="Komende deadlines" link={{ href: "/beheer/toewijzingen", label: "Alle toewijzingen" }}>
            {deadlines.length === 0 ? (
              <EmptyState icon={<CalendarClock />} title="Geen deadlines gepland" variant="card">
                Geef een leerpad een deadline via een toewijzing.
              </EmptyState>
            ) : (
              <Card className={styles.listCard}>
                <ul className={styles.deadlines}>
                  {deadlines.map((a) => {
                    const [day, month] = formatShortDate(a.deadline).split(" ");
                    return (
                      <li key={a.id} className={styles.deadline}>
                        <span className={styles.dateTile} aria-hidden>
                          <span className={styles.dateDay}>{day}</span>
                          <span className={styles.dateMonth}>{month}</span>
                        </span>
                        <div className={styles.deadlineText}>
                          <p className={styles.deadlineTitle}>
                            {a.pathTitle}
                            <span className={styles.deadlineTarget}> · {a.targetLabel}</span>
                          </p>
                          <ProgressBar value={a.progress} className={styles.deadlineBar} />
                          <p className={styles.deadlineMeta}>
                            <span className="visually-hidden">Deadline {formatLongDate(a.deadline)}. </span>
                            <span>
                              {a.completedCount}/{a.members.length} afgerond · {a.progress}%
                            </span>
                            <span className={clsx(a.status === "risico" && styles.risk)}>
                              {a.status === "risico" ? "Risico · " : ""}
                              {formatDaysLeft(a.daysLeft).toLowerCase()}
                            </span>
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Link href="/beheer/toewijzingen" className={styles.cardFooterLink}>
                  Toewijzingen beheren
                  <ArrowRight aria-hidden />
                </Link>
              </Card>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
