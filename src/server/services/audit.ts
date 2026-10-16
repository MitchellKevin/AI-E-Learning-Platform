import type { Types } from "mongoose";
import { AuditLog } from "@/server/models";

export type AuditCategory = "gebruikers" | "beveiliging" | "abonnement" | "organisatie" | "leren";

// Elke beheeractie komt in het auditlog van de organisatie.
export async function audit(input: {
  orgId: Types.ObjectId;
  actor: { _id: Types.ObjectId; firstName: string; lastName: string };
  category: AuditCategory;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
}) {
  await AuditLog.create({
    orgId: input.orgId,
    actorId: input.actor._id,
    actorName: `${input.actor.firstName} ${input.actor.lastName}`.trim(),
    action: input.action,
    target: input.target,
    meta: { category: input.category, ...input.meta },
  });
}
