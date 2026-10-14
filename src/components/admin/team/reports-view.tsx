"use client";

import { useId, useState } from "react";
import clsx from "clsx";
import { Download, FileText } from "lucide-react";
import { Button, Card, PageHeader, Section, SegmentedControl, Stat, useToast, type StatTrend } from "@/components/kit";
import type { PeriodReport, ReportPeriod } from "@/lib/data/admin-team";
import { csvFilename, downloadCsv } from "@/components/admin/shell/csv";
import { addDays, formatLongDate, plural } from "@/components/admin/shell/format";
import { ColumnChart } from "./charts/column-chart";
import styles from "./reports-view.module.scss";

type Funnel = { slug: string; title: string; stages: { label: string; count: number }[] };

type Props = {
  today: string;
  funnel: Funnel[];
  byPeriod: Record<ReportPeriod, PeriodReport>;
  periods: { value: ReportPeriod; label: string; description: string }[];
  initialPeriod: ReportPeriod;
};

const PASS_SCORE = 70;
const periodDays: Record<ReportPeriod, number> = { "30d": 30, "90d": 90, "12m": 365 };

function trend(current: number, previous: number, label: string): StatTrend | undefined {
  if (previous <= 0) return undefined;
  const change = Math.round(((current - previous) / previous) * 100);
  return {
    value: `${change > 0 ? "+" : ""}${change}%`,
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
    label,
  };
}

export function ReportsView({ today, funnel, byPeriod, periods, initialPeriod }: Props) {
  const { toast } = useToast();
  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod);
  const report = byPeriod[period];
  const meta = periods.find((p) => p.value === period)!;
  const from = addDays(today, -periodDays[period]);
  const vs = `t.o.v. de ${periodDays[period] === 365 ? "12 maanden" : `${periodDays[period]} dagen`} ervoor`;
  const { summary } = report;

  function changePeriod(next: ReportPeriod) {
    setPeriod(next);
    // In de URL, zodat een gedeelde link dezelfde periode toont (zonder herladen).
    const url = new URL(window.location.href);
    url.searchParams.set("periode", next);
    window.history.replaceState(null, "", url);
  }

  function exported(filename: string) {
    toast({ variant: "success", title: "Export gedownload", description: filename });
  }

  function exportFunnel() {
    const filename = csvFilename("voortgang-leerpaden", today);
    downloadCsv(
      filename,
      ["Leerpad", "Fase", "Aantal", "Percentage van toegewezen"],
      funnel.flatMap((f) =>
        f.stages.map((s) => [f.title, s.label, s.count, Math.round((s.count / Math.max(f.stages[0].count, 1)) * 100)]),
      ),
    );
    exported(filename);
  }

  function exportTime() {
    const filename = csvFilename(`leertijd-${period}`, today);
    downloadCsv(filename, ["Periode", "Leertijd (uur)"], report.time.points.map((p) => [p.fullLabel, p.value]));
    exported(filename);
  }

  function exportCertificates() {
    const filename = csvFilename(`certificaten-${period}`, today);
    downloadCsv(filename, ["Periode", "Certificaten"], report.certificates.points.map((p) => [p.fullLabel, p.value]));
    exported(filename);
  }

  function exportExams() {
    const filename = csvFilename(`toetsscores-${period}`, today);
    downloadCsv(
      filename,
      ["Leerpad", "Pogingen", "Geslaagd", "Gemiddelde score (%)", "Hoogste score (%)"],
      report.exams.map((e) => [e.title, e.attempts, e.passed, e.avgScore ?? "", e.best ?? ""]),
    );
    exported(filename);
  }

  function exportAll() {
    const filename = csvFilename(`rapportage-${period}`, today);
    const rows: (string | number)[][] = [
      ["Kerncijfers", "Afgeronde hoofdstukken", summary.completedChapters.current],
      ["Kerncijfers", "Actieve cursisten", summary.activeLearners.current],
      ["Kerncijfers", "Leertijd (uur)", summary.hours.current],
      ["Kerncijfers", "Certificaten", summary.certificates.current],
      ["Kerncijfers", "Gemiddelde toetsscore (%)", summary.avgScore.current ?? ""],
      ...report.time.points.map((p) => ["Leertijd (uur)", p.fullLabel, p.value]),
      ...report.certificates.points.map((p) => ["Certificaten", p.fullLabel, p.value]),
      ...report.exams.map((e) => [`Toetsscore ${e.title} (%)`, `${e.attempts} pogingen`, e.avgScore ?? ""]),
      ...funnel.flatMap((f) => f.stages.map((s) => [`Stand vandaag ${f.title}`, s.label, s.count])),
    ];
    downloadCsv(filename, ["Onderdeel", "Omschrijving", "Waarde"], rows);
    exported(filename);
  }

  return (
    <>
      <PageHeader
        title="Rapportages"
        lead="Hoe leert Studio Noord? Exporteer de cijfers voor je MT-overleg of kwartaalrapportage."
        actions={
          <>
            <ComingSoonButton icon={<FileText />}>Download PDF</ComingSoonButton>
            <Button icon={<Download />} onClick={exportAll}>
              Exporteer CSV
            </Button>
          </>
        }
      />

      <Section
        title="Stand vandaag"
        description="Hoe ver zijn collega's in de leerpaden die ze hebben? Telt mee ongeacht de periode."
        actions={<ExportButton label="Exporteer stand vandaag als CSV" onClick={exportFunnel} />}
      >
        <div className={styles.funnels}>
          {funnel.map((f) => {
            const total = Math.max(f.stages[0].count, 1);
            return (
              <Card key={f.slug} className={styles.funnelCard}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardTitle}>{f.title}</h3>
                  <span className={styles.cardMeta}>{plural(f.stages[0].count, "collega", "collega's")}</span>
                </div>
                <ol className={styles.funnel}>
                  {f.stages.map((s, i) => {
                    const pct = Math.round((s.count / total) * 100);
                    return (
                      <li key={s.label} className={styles.stage} style={{ "--i": i } as React.CSSProperties}>
                        <div className={styles.stageHead}>
                          <span>{s.label}</span>
                          <span className={styles.stageValue}>
                            {s.count}
                            <span className={styles.stagePct}> · {pct}%</span>
                          </span>
                        </div>
                        <span className={styles.stageTrack} aria-hidden>
                          <span className={clsx(styles.stageFill, i === f.stages.length - 1 && styles.final)} style={{ width: `${pct}%` }} />
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            );
          })}
        </div>
      </Section>

      <div className={styles.periodBar}>
        <div>
          <h2 className={styles.periodTitle}>Per periode</h2>
          <p className={styles.periodRange} aria-live="polite">
            {formatLongDate(addDays(from, 1))} – {formatLongDate(today)}
          </p>
        </div>
        <SegmentedControl
          label="Periode"
          value={period}
          onValueChange={changePeriod}
          options={periods.map((p) => ({ value: p.value, label: p.label }))}
        />
      </div>

      <section aria-label={`Kerncijfers over ${meta.description}`} className={styles.kpis} key={`kpis-${period}`}>
        <Card className={styles.kpi}>
          <Stat
            value={summary.completedChapters.current}
            label="Afgeronde hoofdstukken"
            trend={trend(summary.completedChapters.current, summary.completedChapters.previous, vs)}
          />
        </Card>
        <Card className={styles.kpi}>
          <Stat
            value={summary.activeLearners.current}
            label="Actieve cursisten"
            trend={trend(summary.activeLearners.current, summary.activeLearners.previous, vs)}
          />
        </Card>
        <Card className={styles.kpi}>
          <Stat
            value={summary.hours.current}
            label="Uur geleerd"
            trend={trend(summary.hours.current, summary.hours.previous, vs)}
          />
        </Card>
        <Card className={styles.kpi}>
          <Stat
            value={summary.certificates.current}
            label="Certificaten"
            trend={
              summary.certificates.previous > 0 || summary.certificates.current > 0
                ? {
                    value: `${summary.certificates.current - summary.certificates.previous >= 0 ? "+" : ""}${
                      summary.certificates.current - summary.certificates.previous
                    }`,
                    direction:
                      summary.certificates.current > summary.certificates.previous
                        ? "up"
                        : summary.certificates.current < summary.certificates.previous
                          ? "down"
                          : "flat",
                    label: vs,
                  }
                : undefined
            }
          />
        </Card>
        <Card className={styles.kpi}>
          <Stat
            value={summary.avgScore.current !== null ? `${summary.avgScore.current}%` : "–"}
            label="Gem. toetsscore"
            hint={summary.avgScore.current === null ? "Geen eindtoetsen in deze periode" : undefined}
            trend={
              summary.avgScore.current !== null && summary.avgScore.previous !== null
                ? {
                    value: `${summary.avgScore.current - summary.avgScore.previous >= 0 ? "+" : ""}${
                      summary.avgScore.current - summary.avgScore.previous
                    } pt`,
                    direction:
                      summary.avgScore.current > summary.avgScore.previous
                        ? "up"
                        : summary.avgScore.current < summary.avgScore.previous
                          ? "down"
                          : "flat",
                    label: vs,
                  }
                : undefined
            }
          />
        </Card>
      </section>

      <div className={styles.grid}>
        <Card className={styles.chartCard}>
          <div className={styles.cardHead}>
            <div>
              <h3 className={styles.cardTitle}>Leertijd</h3>
              <p className={styles.cardMeta}>Uren van het hele team per {report.time.unit}</p>
            </div>
            <ExportButton label="Exporteer leertijd als CSV" onClick={exportTime} />
          </div>
          <ColumnChart
            key={`time-${period}`}
            label={`Leertijd per ${report.time.unit} in uren`}
            valueLabel="Leertijd"
            unit="uur"
            points={report.time.points}
            caption={
              period === "12m"
                ? "Studio Noord gebruikt AI Academy sinds maart 2026; de piek in september is de start van de AI 101-toewijzingen."
                : `In totaal ${summary.hours.current} uur over ${meta.description}.`
            }
          />
        </Card>

        <Card className={styles.chartCard}>
          <div className={styles.cardHead}>
            <div>
              <h3 className={styles.cardTitle}>Certificaten</h3>
              <p className={styles.cardMeta}>
                {plural(report.certificates.total, "certificaat", "certificaten")} behaald, per {report.certificates.unit}
              </p>
            </div>
            <ExportButton label="Exporteer certificaten als CSV" onClick={exportCertificates} />
          </div>
          <ColumnChart
            key={`cert-${period}`}
            label={`Behaalde certificaten per ${report.certificates.unit}`}
            valueLabel="Certificaten"
            unit="behaald"
            points={report.certificates.points}
            caption={
              report.certificates.total === 0
                ? "Geen nieuwe certificaten in deze periode."
                : "Een certificaat volgt op een gehaalde eindtoets (70% of hoger)."
            }
          />
        </Card>

        <Card className={clsx(styles.chartCard, styles.wide)}>
          <div className={styles.cardHead}>
            <div>
              <h3 className={styles.cardTitle}>Toetsscores per leerpad</h3>
              <p className={styles.cardMeta}>Gemiddelde score van alle pogingen; geslaagd vanaf {PASS_SCORE}%</p>
            </div>
            <ExportButton label="Exporteer toetsscores als CSV" onClick={exportExams} />
          </div>
          <ul className={styles.exams} key={`exams-${period}`}>
            {report.exams.map((e, i) => (
              <li key={e.slug} className={styles.exam} style={{ "--i": i } as React.CSSProperties}>
                <div className={styles.examHead}>
                  <span className={styles.examTitle}>{e.title}</span>
                  <span className={styles.examScore}>{e.avgScore !== null ? `${e.avgScore}%` : "–"}</span>
                </div>
                <span
                  className={styles.scoreTrack}
                  role="img"
                  aria-label={
                    e.avgScore !== null
                      ? `${e.title}: gemiddeld ${e.avgScore}%, slaaggrens ${PASS_SCORE}%`
                      : `${e.title}: geen pogingen`
                  }
                >
                  {e.avgScore !== null && (
                    <span
                      className={clsx(styles.scoreFill, e.avgScore < PASS_SCORE && styles.below)}
                      style={{ width: `${e.avgScore}%` }}
                    />
                  )}
                  <span className={styles.passMark} style={{ left: `${PASS_SCORE}%` }} />
                </span>
                <p className={styles.examMeta}>
                  {e.attempts === 0
                    ? "Geen pogingen in deze periode"
                    : `${plural(e.attempts, "poging", "pogingen")} · ${e.passed} geslaagd (${Math.round((e.passed / e.attempts) * 100)}%) · hoogste ${e.best}%`}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" icon={<Download />} onClick={onClick} aria-label={label} className={styles.exportButton}>
      CSV
    </Button>
  );
}

// Knop die er al staat maar nog niet werkt, met uitleg bij hover en focus.
function ComingSoonButton({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  const tipId = `soon${useId().replace(/:/g, "")}`;
  return (
    <span className={styles.soon}>
      <Button
        variant="secondary"
        icon={icon}
        aria-disabled="true"
        aria-describedby={tipId}
        onClick={(e) => e.preventDefault()}
      >
        {children}
      </Button>
      <span role="tooltip" id={tipId} className={styles.tooltip}>
        Binnenkort beschikbaar
      </span>
    </span>
  );
}
