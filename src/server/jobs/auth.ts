import { createHash, timingSafeEqual } from "node:crypto";

// Toegang tot /api/cron: alleen met "Authorization: Bearer <CRON_SECRET>". Zonder (geldig) geheim kan niemand erbij.

const digest = (value: string) => createHash("sha256").update(value).digest();

export function isCronAuthorized(authorization: string | null | undefined, secret: string | undefined) {
  if (!secret || secret.length < 16 || !authorization) return false;
  // Hashes zijn even lang, dus timingSafeEqual verraadt ook de lengte niet.
  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`));
}
