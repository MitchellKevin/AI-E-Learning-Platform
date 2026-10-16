import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_util";

// Voortgang, activiteit, punten en badges.

const ref = (model: string, required = true) => ({ type: Schema.Types.ObjectId, ref: model, required });

const taskProgressSchema = new Schema({
  userId: ref("User"),
  orgId: ref("Organization"),
  pathSlug: { type: String, required: true },
  chapterId: { type: String, required: true },
  taskId: { type: String, required: true },
  answer: String,
  completedAt: { type: Date, default: Date.now },
});
taskProgressSchema.index({ userId: 1, chapterId: 1, taskId: 1 }, { unique: true });
taskProgressSchema.index({ orgId: 1, completedAt: -1 });

const activityDaySchema = new Schema({
  userId: ref("User"),
  orgId: ref("Organization"),
  // Kalenderdag in Europe/Amsterdam, "YYYY-MM-DD".
  date: { type: String, required: true },
  minutes: { type: Number, default: 0 },
});
activityDaySchema.index({ userId: 1, date: 1 }, { unique: true });
activityDaySchema.index({ orgId: 1, date: 1 });

export const pointReasons = ["hoofdstuk", "oefening", "quiz", "streak", "certificaat", "start"] as const;
export type PointReason = (typeof pointReasons)[number];

const pointEventSchema = new Schema({
  userId: ref("User"),
  orgId: ref("Organization"),
  amount: { type: Number, required: true },
  reason: { type: String, enum: pointReasons, required: true },
  // Waar de punten voor zijn (hoofdstuk-id, oefening-slug…). Samen met reason uniek: nooit dubbel punten.
  refId: { type: String, required: true },
  label: String,
  createdAt: { type: Date, default: Date.now },
});
pointEventSchema.index({ userId: 1, reason: 1, refId: 1 }, { unique: true });
pointEventSchema.index({ orgId: 1, createdAt: -1 });

const userBadgeSchema = new Schema({
  userId: ref("User"),
  code: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now },
});
userBadgeSchema.index({ userId: 1, code: 1 }, { unique: true });

const enrollmentSchema = new Schema({
  userId: ref("User"),
  orgId: ref("Organization"),
  pathSlug: { type: String, required: true },
  chosenAt: { type: Date, default: Date.now },
});
enrollmentSchema.index({ userId: 1, pathSlug: 1 }, { unique: true });

const practiceAttemptSchema = new Schema({
  userId: ref("User"),
  orgId: ref("Organization"),
  exerciseSlug: { type: String, required: true },
  prompt: String,
  score: Number,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
practiceAttemptSchema.index({ userId: 1, exerciseSlug: 1 });

type WithId<T> = T & { _id: Types.ObjectId };
export type TaskProgressDoc = WithId<InferSchemaType<typeof taskProgressSchema>>;
export type ActivityDayDoc = WithId<InferSchemaType<typeof activityDaySchema>>;
export type PointEventDoc = WithId<InferSchemaType<typeof pointEventSchema>>;

export const TaskProgress = defineModel("TaskProgress", taskProgressSchema);
export const ActivityDay = defineModel("ActivityDay", activityDaySchema);
export const PointEvent = defineModel("PointEvent", pointEventSchema);
export const UserBadge = defineModel("UserBadge", userBadgeSchema);
export const Enrollment = defineModel("Enrollment", enrollmentSchema);
export const PracticeAttempt = defineModel("PracticeAttempt", practiceAttemptSchema);
