import "server-only";
import { z } from "zod";

// Server-omgevingsvariabelen, één keer gevalideerd.

// Een lege regel in .env ("KEY=") betekent: niet ingesteld.
const optional = (schema: z.ZodString) => z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const schema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI ontbreekt (zie .env.example)"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET ontbreekt of is te kort"),
  DEMO_LOGIN: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  // Geheim waarmee Vercel Cron (en jij lokaal) de geplande taken aanroept.
  CRON_SECRET: optional(z.string().min(16)),
  AUTH_GOOGLE_ID: optional(z.string()),
  AUTH_GOOGLE_SECRET: optional(z.string()),
  AUTH_MICROSOFT_ENTRA_ID_ID: optional(z.string()),
  AUTH_MICROSOFT_ENTRA_ID_SECRET: optional(z.string()),
  AUTH_MICROSOFT_ENTRA_ID_ISSUER: optional(z.string()),
});

let cached: z.infer<typeof schema> | undefined;

export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Ongeldige omgevingsvariabelen:\n${parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n")}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export const ssoEnabled = {
  google: () => Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  microsoft: () => Boolean(process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET),
};

export { demoLoginEnabled } from "./flags";
