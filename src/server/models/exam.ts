import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_util";

const examAttemptSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  pathSlug: { type: String, required: true },
  questionIds: [String],
  // Antwoord per vraag-id: optie-id(s) of open tekst.
  answers: { type: Schema.Types.Mixed, default: {} },
  // Resultaat per vraag-id, ingevuld bij indienen.
  results: Schema.Types.Mixed,
  score: Number,
  passed: Boolean,
  startedAt: { type: Date, default: Date.now },
  submittedAt: Date,
});
examAttemptSchema.index({ userId: 1, pathSlug: 1, startedAt: -1 });

const certificateSchema = new Schema({
  number: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  pathSlug: { type: String, required: true },
  // Naam zoals op het certificaat; blijft staan als het profiel later wijzigt.
  holderName: { type: String, required: true },
  score: { type: Number, required: true },
  attemptId: { type: Schema.Types.ObjectId, ref: "ExamAttempt" },
  issuedAt: { type: Date, default: Date.now },
});
certificateSchema.index({ userId: 1, pathSlug: 1 }, { unique: true });

export type ExamAttemptDoc = InferSchemaType<typeof examAttemptSchema> & { _id: Types.ObjectId };
export type CertificateDoc = InferSchemaType<typeof certificateSchema> & { _id: Types.ObjectId };
export const ExamAttempt = defineModel("ExamAttempt", examAttemptSchema);
export const Certificate = defineModel("Certificate", certificateSchema);
