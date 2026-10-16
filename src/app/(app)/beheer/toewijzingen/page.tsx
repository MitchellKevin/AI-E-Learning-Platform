import type { Metadata } from "next";
import { getAdminPaths, getAssignments, getReferenceDate, getTeamMembers, getTeamNames } from "@/lib/data/admin-team";
import { AssignmentsView } from "@/components/admin/team/assignments-view";
import type { MemberOption } from "@/components/admin/team/new-assignment-dialog";

export const metadata: Metadata = { title: "Toewijzingen · Beheer · AI Academy" };

type Props = { searchParams: Promise<{ nieuw?: string }> };

export default async function AdminAssignmentsPage({ searchParams }: Props) {
  const [assignments, members, paths, today, teamNames, params] = await Promise.all([
    getAssignments(),
    getTeamMembers(),
    getAdminPaths(),
    getReferenceDate(),
    getTeamNames(),
    searchParams,
  ]);

  // Alleen wat de keuzelijst en de voortgangsberekening nodig hebben naar de browser.
  const options: MemberOption[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
    team: m.team,
    role: m.role,
    progress: Object.fromEntries(m.paths.map((p) => [p.slug, p.progress])),
  }));

  return (
    <AssignmentsView
      assignments={assignments}
      members={options}
      paths={paths}
      teams={teamNames.filter((t) => members.some((m) => m.team === t))}
      today={today}
      startOpen={params.nieuw === "1"}
    />
  );
}
