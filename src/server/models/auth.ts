import { Schema, type InferSchemaType } from "mongoose";
import { defineModel } from "./_util";

// Collecties voor Auth.js: gekoppelde SSO-accounts en tokens voor inloglinks.

const accountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
    refresh_token: String,
    access_token: String,
    expires_at: Number,
    token_type: String,
    scope: String,
    id_token: String,
    session_state: String,
  },
  { timestamps: true },
);
accountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

const verificationTokenSchema = new Schema({
  identifier: { type: String, required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
});
verificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });
verificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export type AccountDoc = InferSchemaType<typeof accountSchema>;
export const Account = defineModel("Account", accountSchema);
export const VerificationToken = defineModel("VerificationToken", verificationTokenSchema);
