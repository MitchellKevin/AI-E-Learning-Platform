import type { Types } from "mongoose";
import { PointEvent, type PointReason } from "@/server/models";

// Punten per actie; gelijk aan de uitleg op het leaderboard.
export const POINTS = { hoofdstuk: 120, oefening: 40, quiz: 25, streak: 50, certificaat: 500 } as const;

/** Kent punten één keer toe per (reden, refId). Geeft true als het nieuw was. */
export async function awardPoints(input: {
  userId: Types.ObjectId;
  orgId: Types.ObjectId;
  reason: PointReason;
  refId: string;
  amount: number;
  label?: string;
}) {
  try {
    await PointEvent.create(input);
    return true;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return false;
    throw error;
  }
}

export async function totalPoints(userId: Types.ObjectId, since?: Date) {
  const [result] = await PointEvent.aggregate<{ total: number }>([
    { $match: { userId, ...(since && { createdAt: { $gte: since } }) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result?.total ?? 0;
}
