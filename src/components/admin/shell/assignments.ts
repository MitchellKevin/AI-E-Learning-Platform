import type { Assignment, AssignmentStatus, MockAssignment, TeamMember } from "@/lib/data/admin-team";
import { daysBetween, plural } from "./format";

// Pure rekenregels voor toewijzingen, zodat server (data) en browser (nieuwe toewijzing) hetzelfde rekenen.

export function expectedProgress(createdAt: string, deadline: string, today: string) {
  const total = Math.max(daysBetween(createdAt, deadline), 1);
  return Math.min(100, Math.max(0, Math.round((daysBetween(createdAt, today) / total) * 100)));
}

const statusOrder: Record<AssignmentStatus, number> = { verlopen: 0, risico: 1, "op-schema": 2, afgerond: 3 };

export const byStatusThenDeadline = (a: Assignment, b: Assignment) =>
  statusOrder[a.status] - statusOrder[b.status] || a.deadline.localeCompare(b.deadline);

/** Rekent voortgang en status van een toewijzing uit; ook gebruikt voor nieuwe toewijzingen in de browser. */
export function summarizeAssignment(
  a: MockAssignment,
  assigned: Pick<TeamMember, "id" | "name" | "initials">[],
  progressOf: (memberId: string) => number,
  pathTitle: string,
  today: string,
): Assignment {
  const progresses = assigned.map((m) => progressOf(m.id));
  const completedCount = progresses.filter((p) => p >= 100).length;
  const progress = progresses.length ? Math.round(progresses.reduce((s, p) => s + p, 0) / progresses.length) : 0;
  const expected = expectedProgress(a.createdAt, a.deadline, today);
  const daysLeft = daysBetween(today, a.deadline);
  const status: AssignmentStatus =
    assigned.length > 0 && completedCount === assigned.length
      ? "afgerond"
      : daysLeft < 0
        ? "verlopen"
        : progress < expected - 10
          ? "risico"
          : "op-schema";

  const targetLabel =
    a.target.kind === "team"
      ? a.target.teams.length === 1
        ? `Team ${a.target.teams[0]}`
        : a.target.teams.join(", ")
      : assigned.length === 1
        ? assigned[0].name
        : plural(assigned.length, "persoon", "personen");

  return {
    ...a,
    pathTitle,
    targetLabel,
    members: assigned.map(({ id, name, initials }) => ({ id, name, initials })),
    completedCount,
    progress,
    expected,
    daysLeft,
    status,
  };
}

