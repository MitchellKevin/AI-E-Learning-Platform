import { Schema, type InferSchemaType, type Types } from "mongoose";
import { defineModel } from "./_util";

export const userRoles = ["learner", "manager", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

const channels = (email: boolean) => ({ email: { type: Boolean, default: email }, inApp: { type: Boolean, default: true } });

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: Date,
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    image: String,
    jobTitle: { type: String, default: "" },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    role: { type: String, enum: userRoles, default: "learner" },
    status: { type: String, enum: ["actief", "gedeactiveerd"], default: "actief" },
    // Vanaf dit moment loopt de bewaartermijn van de organisatie.
    deactivatedAt: Date,
    loginProvider: { type: String, default: "E-mail" },
    lastActiveAt: Date,
    // Laatste geregistreerde leerminuut (voorkomt dubbel tellen bij meerdere tabbladen).
    lastMinuteAt: Date,
    onboarding: {
      completedAt: Date,
      role: String,
      level: String,
      goals: [String],
      levelTest: { type: String, enum: ["gedaan", "overgeslagen"] },
      // Onderwerpen van AI 101 die de niveautoets als bekend aanmerkte.
      knownTopics: [String],
    },
    settings: {
      learning: {
        weekGoal: { type: Number, default: 120 },
        focus: { type: String, enum: ["design", "development", "beide"], default: "beide" },
        dailyReminder: { type: Boolean, default: true },
        reminderTime: { type: String, default: "09:00" },
      },
      notifications: {
        reminders: channels(false),
        streak: channels(false),
        deadlines: channels(true),
        certificates: channels(true),
        productUpdates: channels(false),
      },
      privacy: {
        showOnLeaderboard: { type: Boolean, default: true },
        visibleToTeam: { type: Boolean, default: true },
      },
      language: { locale: { type: String, enum: ["nl", "en"], default: "nl" } },
    },
    deletionRequestedAt: Date,
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId; createdAt: Date };
export const User = defineModel("User", userSchema);

export function initialsOf(firstName: string, lastName: string, email = "") {
  const parts = [firstName, ...lastName.split(" ").filter((p) => p && p[0] === p[0].toUpperCase())];
  const letters = (parts[0]?.[0] ?? email[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  return letters.toUpperCase();
}

export function fullName(user: { firstName?: string | null; lastName?: string | null; email?: string }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "";
}
