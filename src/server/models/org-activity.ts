import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_util";

// Toewijzingen, meldingen en het auditlog.

const assignmentSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    pathSlug: { type: String, required: true },
    teamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    userIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deadline: Date,
    required: { type: Boolean, default: false },
    message: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    // Zacht verwijderd, zodat "Ongedaan maken" kan.
    deletedAt: Date,
  },
  { timestamps: true },
);

export const notificationTypes = ["streak", "assignment", "badge", "certificate", "team", "reminder"] as const;

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  type: { type: String, enum: notificationTypes, required: true },
  title: { type: String, required: true },
  body: { type: String, default: "" },
  href: { type: String, default: "/dashboard" },
  // Unieke sleutel voor meldingen uit geplande taken, zodat een herhaalde run niets dubbel stuurt.
  dedupeKey: String,
  readAt: Date,
  createdAt: { type: Date, default: Date.now },
});
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

const auditLogSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  actorId: { type: Schema.Types.ObjectId, ref: "User" },
  actorName: String,
  action: { type: String, required: true },
  target: String,
  meta: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});
auditLogSchema.index({ orgId: 1, createdAt: -1 });

export type AssignmentDoc = InferSchemaType<typeof assignmentSchema> & { _id: Types.ObjectId; createdAt: Date };
export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };
export const Assignment = defineModel("Assignment", assignmentSchema);
export const Notification = defineModel("Notification", notificationSchema);
export const AuditLog = defineModel("AuditLog", auditLogSchema);
