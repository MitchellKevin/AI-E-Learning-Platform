import type { BadgeVariant } from "@/components/kit";
import type { AssignmentStatus, MemberStatus } from "@/lib/data/admin-team";

// Labels en kleuren voor statussen, overal in beheer hetzelfde.

export const statusLabel: Record<MemberStatus, string> = {
  actief: "Actief",
  achter: "Achter op schema",
  inactief: "Inactief",
  uitgenodigd: "Uitgenodigd",
};

export const statusVariant: Record<MemberStatus, BadgeVariant> = {
  actief: "success",
  achter: "warning",
  inactief: "danger",
  uitgenodigd: "neutral",
};

export const assignmentStatusLabel: Record<AssignmentStatus, string> = {
  "op-schema": "Op schema",
  risico: "Risico",
  verlopen: "Verlopen",
  afgerond: "Afgerond",
};

export const assignmentStatusVariant: Record<AssignmentStatus, BadgeVariant> = {
  "op-schema": "success",
  risico: "warning",
  verlopen: "danger",
  afgerond: "brand",
};
