"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { guarded } from "@/server/actions/result";
import { connectDb } from "@/server/db";
import { sendMail } from "@/server/mailer";
import { ConsentLog, DemoRequest, HelpFeedback } from "@/server/models";
import { HOUR, assertRateLimit, clientIp } from "@/server/services/rate-limit";

// Publieke formulieren (zonder inloggen): demo-aanvraag, feedback op helpartikelen en het consentlogboek.
// Per IP-adres begrensd, zodat niemand de database of de mailbox van sales kan volspammen.

async function limitByIp(name: string, limit: number) {
  await assertRateLimit({ key: `${name}:ip:${clientIp(await headers())}`, limit, windowMs: HOUR });
}

const demoInput = z.object({
  naam: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  bedrijf: z.string().trim().min(1).max(160),
  teamgrootte: z.string().max(40),
  rol: z.string().max(80),
  abonnement: z.string().max(40).optional(),
  bericht: z.string().max(4000).optional(),
  toestemming: z.literal(true),
});

export async function requestDemoAction(input: z.input<typeof demoInput>) {
  return guarded(async () => {
    const data = demoInput.parse(input);
    await connectDb();
    await limitByIp("demo-aanvraag", 5);
    await DemoRequest.create({
      name: data.naam,
      email: data.email,
      company: data.bedrijf,
      teamSize: data.teamgrootte,
      role: data.rol,
      plan: data.abonnement,
      message: data.bericht,
    });
    // Seintje aan het salesteam.
    await sendMail({
      to: "sales@aiacademy.nl",
      subject: `Demo-aanvraag: ${data.bedrijf} (${data.teamgrootte})`,
      text: `${data.naam} <${data.email}>, ${data.rol}\n\n${data.bericht ?? ""}`,
    });
  });
}

export async function helpFeedbackAction(articleSlug: string, helpful: boolean, comment?: string) {
  return guarded(async () => {
    const data = z
      .object({ articleSlug: z.string().regex(/^[a-z0-9-]+$/).max(120), helpful: z.boolean(), comment: z.string().max(2000).optional() })
      .parse({ articleSlug, helpful, comment });
    await connectDb();
    await limitByIp("help-feedback", 60);
    await HelpFeedback.create(data);
  });
}

// Consentlogboek (AVG: aantonen welke toestemming iemand gaf). Geeft het consent-id terug voor in de browser.
export async function logConsentAction(categories: { analytics: boolean; marketing: boolean }, consentId?: string) {
  return guarded(async () => {
    const data = z
      .object({ analytics: z.boolean(), marketing: z.boolean(), consentId: z.string().uuid().optional() })
      .parse({ ...categories, consentId });
    await connectDb();
    // Ruim: een heel kantoor achter één IP mag zijn keuze vastleggen (AVG-logboek).
    await limitByIp("consent", 500);
    const id = data.consentId ?? randomUUID();
    await ConsentLog.create({ consentId: id, categories: { analytics: data.analytics, marketing: data.marketing } });
    return id;
  });
}
