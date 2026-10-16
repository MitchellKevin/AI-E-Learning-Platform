import { Schema } from "mongoose";
import { defineModel } from "./_util";

// Kleine collecties voor publieke formulieren.

const demoRequestSchema = new Schema({
  name: String,
  email: { type: String, lowercase: true },
  company: String,
  teamSize: String,
  role: String,
  plan: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const helpFeedbackSchema = new Schema({
  articleSlug: { type: String, required: true, index: true },
  helpful: { type: Boolean, required: true },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const consentLogSchema = new Schema({
  consentId: { type: String, required: true },
  categories: { analytics: Boolean, marketing: Boolean },
  createdAt: { type: Date, default: Date.now },
});

export const DemoRequest = defineModel("DemoRequest", demoRequestSchema);
export const HelpFeedback = defineModel("HelpFeedback", helpFeedbackSchema);
export const ConsentLog = defineModel("ConsentLog", consentLogSchema);
