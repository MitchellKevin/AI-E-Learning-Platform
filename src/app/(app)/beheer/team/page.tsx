import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import {
  getAdminPaths,
  getReferenceDate,
  getTeamMembers,
  getTeamNames,
  type MemberStatus,
  type TeamName,
} from "@/lib/data/admin-team";
import { Button, PageHeader } from "@/components/kit";
import { TeamTable } from "@/components/admin/team/team-table";
import { statusLabel } from "@/components/admin/team/status";
import { plural } from "@/components/admin/shell/format";
import { requireRole } from "@/server/session";

export const metadata: Metadata = { title: "Team · Beheer · AI Academy" };

type Props = { searchParams: Promise<{ team?: string; status?: string }> };

export default async function AdminTeamPage({ searchParams }: Props) {
  const [members, paths, today, teamNames, params, user] = await Promise.all([
    getTeamMembers(),
    getAdminPaths(),
    getReferenceDate(),
    getTeamNames(),
    searchParams,
    requireRole("manager"),
  ]);

  // Filters uit de URL, zodat bv. het overzicht direct naar "Inactief" kan linken.
  const initialTeam = teamNames.find((t) => t.toLowerCase() === params.team?.toLowerCase()) as TeamName | undefined;
  const initialStatus = (Object.keys(statusLabel) as MemberStatus[]).find((s) => s === params.status);

  const teamsInUse = teamNames.filter((t) => members.some((m) => m.team === t));

  return (
    <>
      <PageHeader
        title="Team"
        lead={`${plural(members.length, "collega", "collega's")} in ${plural(teamsInUse.length, "team", "teams")}. Zoek, filter en stuur gericht een herinnering of een leerpad.`}
        actions={
          // Uitnodigen kan alleen een beheerder.
          user.role === "admin" ? (
            <Button href="/beheer/gebruikers" variant="secondary" icon={<UserPlus />}>
              Collega uitnodigen
            </Button>
          ) : undefined
        }
      />
      <TeamTable
        members={members}
        paths={paths}
        teams={teamsInUse}
        today={today}
        initialTeam={initialTeam}
        initialStatus={initialStatus}
      />
    </>
  );
}
