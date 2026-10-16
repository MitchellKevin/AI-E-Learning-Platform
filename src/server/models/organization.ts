import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_util";

const organizationSchema = new Schema(
  {
    name: { type: String, required: true },
    legalName: { type: String, default: "" },
    website: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    initials: { type: String, required: true },
    brandColor: { type: String, default: "#1d4ed8" },
    // Domeinen waarmee collega's automatisch kunnen toetreden.
    domains: [
      {
        domain: { type: String, lowercase: true },
        verified: { type: Boolean, default: false },
        addedAt: { type: Date, default: Date.now },
        // Zacht verwijderd, zodat "Ongedaan maken" de verificatie behoudt zonder de browser te vertrouwen.
        removedAt: Date,
      },
    ],
    autoJoin: { type: Boolean, default: false },
    autoJoinTeamId: { type: Schema.Types.ObjectId, ref: "Team" },
    sso: {
      provider: { type: String, enum: ["microsoft", "google"] },
      status: { type: String, enum: ["niet-ingesteld", "verbonden"], default: "niet-ingesteld" },
      tenant: String,
      connectedAt: Date,
      lastSyncAt: Date,
      // Alleen inloggen via SSO; inloggen per e-mail staat dan uit.
      enforced: { type: Boolean, default: false },
    },
    plan: { type: String, enum: ["starter", "team", "enterprise"], default: "team" },
    seats: { type: Number, default: 10 },
    dataRegion: { type: String, default: "EU (Frankfurt)" },
    // Bewaartermijn na deactivatie: aantal maanden, of tot het einde van het contract.
    retention: { type: String, enum: ["12", "24", "36", "contract"], default: "24" },
    dpa: {
      version: { type: String, default: "2.1" },
      signedAt: Date,
      signedBy: String,
    },
    deletionRequestedAt: Date,
  },
  { timestamps: true },
);

organizationSchema.index({ "domains.domain": 1 });

export type OrganizationDoc = InferSchemaType<typeof organizationSchema> & { _id: Types.ObjectId };
export const Organization = defineModel("Organization", organizationSchema);
