import type { Types } from "mongoose";
import { Notification, RateLimit, User, type notificationTypes } from "@/server/models";
import { sendMail } from "@/server/mailer";
import { addDays } from "./dates";

// Meldingen in de app (en optioneel per e-mail), volgens de voorkeuren van de gebruiker.

type NotificationType = (typeof notificationTypes)[number];

// Welke instelling hoort bij welk soort melding. Badges vallen onder "Certificaten en badges"; teamnieuws volgt geen instelling.
const preferenceFor: Partial<Record<NotificationType, "streak" | "deadlines" | "certificates" | "reminders">> = {
  streak: "streak",
  assignment: "deadlines",
  certificate: "certificates",
  badge: "certificates",
  reminder: "reminders",
};

const isDuplicate = (error: unknown) => (error as { code?: number }).code === 11000;

const claimKey = (dedupeKey: string) => `melding:${dedupeKey}`;
const claimWindow = new Date(0);

// Legt een dedupeKey één keer vast, ook als alleen e-mail aan staat (dan is er geen melding om op te controleren).
async function claimOnce(dedupeKey: string) {
  try {
    await RateLimit.create({ key: claimKey(dedupeKey), windowStart: claimWindow, count: 1, expiresAt: addDays(new Date(), 60) });
    return true;
  } catch (error) {
    if (isDuplicate(error)) return false;
    throw error;
  }
}

/** Welke van deze dedupeKeys al eens zijn verstuurd (de laatste 60 dagen). */
export async function alreadyNotified(dedupeKeys: string[]) {
  if (!dedupeKeys.length) return new Set<string>();
  const claimed = await RateLimit.find({ key: { $in: dedupeKeys.map(claimKey) }, windowStart: claimWindow }, { key: 1 }).lean();
  const keys = new Set(claimed.map((c) => c.key));
  return new Set(dedupeKeys.filter((k) => keys.has(claimKey(k))));
}

/**
 * Stuurt een melding. Met een dedupeKey (geplande taken) gaat die per sleutel maar één keer uit.
 * Geeft true als er iets is verstuurd.
 */
export async function notify(input: {
  userId: Types.ObjectId;
  orgId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  dedupeKey?: string;
}) {
  const user = await User.findById(input.userId, { email: 1, settings: 1 }).lean();
  if (!user) return false;
  const key = preferenceFor[input.type];
  const channels = key ? user.settings?.notifications?.[key] : { inApp: true, email: false };
  const inApp = channels?.inApp !== false;
  const email = Boolean(key && channels?.email);
  if (!inApp && !email) return false;
  if (input.dedupeKey && !(await claimOnce(input.dedupeKey))) return false;

  if (inApp) {
    try {
      await Notification.create({ ...input, body: input.body ?? "", href: input.href ?? "/dashboard" });
    } catch (error) {
      if (input.dedupeKey && isDuplicate(error)) return false;
      // Niet aangekomen: sleutel weer vrijgeven, zodat de volgende run het opnieuw probeert.
      if (input.dedupeKey) await RateLimit.deleteOne({ key: claimKey(input.dedupeKey), windowStart: claimWindow }).catch(() => {});
      throw error;
    }
  }
  if (email) {
    await sendMail({ to: user.email, subject: input.title, text: input.body ?? "", url: input.href });
  }
  return true;
}
