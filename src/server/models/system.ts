import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_util";

// Systeemcollecties: rate limiting, geplande taken en leaderboard-momentopnames.

const rateLimitSchema = new Schema({
  key: { type: String, required: true },
  windowStart: { type: Date, required: true },
  count: { type: Number, default: 0 },
  // Wordt automatisch opgeruimd na afloop.
  expiresAt: { type: Date, required: true },
});
rateLimitSchema.index({ key: 1, windowStart: 1 }, { unique: true });
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const jobRunSchema = new Schema({
  job: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  finishedAt: Date,
  // Slot tegen overlappende runs van dezelfde taak.
  lockedUntil: Date,
  status: { type: String, enum: ["bezig", "klaar", "mislukt"], default: "bezig" },
  result: Schema.Types.Mixed,
  error: String,
});
jobRunSchema.index({ job: 1, startedAt: -1 });

const leaderboardSnapshotSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  teamId: { type: Schema.Types.ObjectId, ref: "Team" },
  // "YYYY-MM" van de afgesloten maand.
  month: { type: String, required: true },
  entries: [{ userId: { type: Schema.Types.ObjectId, ref: "User" }, rank: Number, points: Number }],
  createdAt: { type: Date, default: Date.now },
});
leaderboardSnapshotSchema.index({ orgId: 1, teamId: 1, month: 1 }, { unique: true });

export type JobRunDoc = InferSchemaType<typeof jobRunSchema> & { _id: Types.ObjectId };
export const RateLimit = defineModel("RateLimit", rateLimitSchema);
export const JobRun = defineModel("JobRun", jobRunSchema);
export const LeaderboardSnapshot = defineModel("LeaderboardSnapshot", leaderboardSnapshotSchema);
