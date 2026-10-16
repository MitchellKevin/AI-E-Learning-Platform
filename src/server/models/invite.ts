import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_util";
import { userRoles } from "./user";

const inviteSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: userRoles, default: "learner" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    message: String,
    paths: [String],
    deadline: Date,
    expiresAt: { type: Date, required: true },
    acceptedAt: Date,
    revokedAt: Date,
    lastSentAt: Date,
  },
  { timestamps: true },
);

inviteSchema.index({ orgId: 1, email: 1 });

export type InviteDoc = InferSchemaType<typeof inviteSchema> & { _id: Types.ObjectId; createdAt: Date };
export const Invite = defineModel("Invite", inviteSchema);
