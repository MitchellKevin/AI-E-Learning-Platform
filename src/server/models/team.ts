import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_util";

const teamSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

teamSchema.index({ orgId: 1, name: 1 }, { unique: true });

export type TeamDoc = InferSchemaType<typeof teamSchema> & { _id: Types.ObjectId };
export const Team = defineModel("Team", teamSchema);
