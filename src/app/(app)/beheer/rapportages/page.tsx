import type { Metadata } from "next";
import { getReports, reportPeriods, type ReportPeriod } from "@/lib/data/admin-team";
import { ReportsView } from "@/components/admin/team/reports-view";

export const metadata: Metadata = { title: "Rapportages · Beheer · AI Academy" };

type Props = { searchParams: Promise<{ periode?: string }> };

export default async function AdminReportsPage({ searchParams }: Props) {
  const [{ today, funnel, byPeriod }, params] = await Promise.all([getReports(), searchParams]);
  const initialPeriod: ReportPeriod = reportPeriods.find((p) => p.value === params.periode)?.value ?? "90d";

  return (
    <ReportsView
      today={today}
      funnel={funnel}
      byPeriod={byPeriod}
      periods={reportPeriods}
      initialPeriod={initialPeriod}
    />
  );
}
