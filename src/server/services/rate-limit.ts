import { createHmac } from "node:crypto";
import { isIPv4, isIPv6 } from "node:net";
import { UserError } from "@/server/errors";
import { RateLimit } from "@/server/models";

// Rate limiting in MongoDB met een vast tijdvenster, zonder Redis.
// Sleutels bevatten e-mail- of IP-adressen: we bewaren alleen de naam van de limiet plus een HMAC
// (met AUTH_SECRET), zodat een databasedump niet met een lijst adressen terug te rekenen is.

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export type RateLimitOptions = {
  /** Bijvoorbeeld "magic-link:email:anna@bedrijf.nl". Het deel vóór de eerste ":" blijft leesbaar. */
  key: string;
  limit: number;
  windowMs: number;
  /** Hoeveel deze aanroep meetelt, bijvoorbeeld het aantal uitnodigingen. Standaard 1. */
  cost?: number;
  now?: Date;
};

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

// Ruimte na het venster voordat MongoDB het document opruimt.
const EXPIRY_MARGIN_MS = MINUTE;

function storedKey(key: string) {
  const name = key.split(":")[0];
  return `${name}:${createHmac("sha256", process.env.AUTH_SECRET ?? "").update(key).digest("base64url").slice(0, 32)}`;
}

function windowOf(now: Date, windowMs: number) {
  const start = Math.floor(now.getTime() / windowMs) * windowMs;
  return { windowStart: new Date(start), windowEnd: start + windowMs };
}

const retryAfter = (windowEnd: number, now: Date) => Math.max(1, Math.ceil((windowEnd - now.getTime()) / 1000));

const isDuplicateKey = (error: unknown) => (error as { code?: number } | null)?.code === 11000;

export async function rateLimit({ key, limit, windowMs, cost = 1, now = new Date() }: RateLimitOptions): Promise<RateLimitResult> {
  const { windowStart, windowEnd } = windowOf(now, windowMs);
  const filter = { key: storedKey(key), windowStart };

  // Atomair ophogen; bij een gelijktijdige eerste upsert wint er één en proberen we het nog één keer.
  const increment = () =>
    RateLimit.findOneAndUpdate(
      filter,
      { $inc: { count: cost }, $setOnInsert: { expiresAt: new Date(windowEnd + EXPIRY_MARGIN_MS) } },
      { upsert: true, returnDocument: "after" },
    ).lean();
  const doc = await increment().catch((error) => {
    if (isDuplicateKey(error)) return increment();
    throw error;
  });

  const count = doc?.count ?? cost;
  if (count <= limit) return { ok: true, remaining: limit - count, retryAfterSeconds: 0 };

  // Geweigerd: terugdraaien, zodat een te grote aanvraag het tegoed niet opmaakt.
  await RateLimit.updateOne(filter, { $inc: { count: -cost } });
  return { ok: false, remaining: Math.max(0, limit - (count - cost)), retryAfterSeconds: retryAfter(windowEnd, now) };
}

/** Past `cost` nog binnen de limiet? Kijkt alleen, telt niet mee. */
export async function peekRateLimit({ key, limit, windowMs, cost = 1, now = new Date() }: RateLimitOptions): Promise<RateLimitResult> {
  const { windowStart, windowEnd } = windowOf(now, windowMs);
  const doc = await RateLimit.findOne({ key: storedKey(key), windowStart }).lean();
  const count = doc?.count ?? 0;
  if (count + cost <= limit) return { ok: true, remaining: limit - count, retryAfterSeconds: 0 };
  return { ok: false, remaining: Math.max(0, limit - count), retryAfterSeconds: retryAfter(windowEnd, now) };
}

// Inloglinks per e-mailadres: Auth.js telt bij het versturen (ook bij directe POSTs), de server action kijkt vooraf
// alleen. Eén teller, één telling per aanvraag. Genormaliseerd zoals Auth.js het adres normaliseert.
export const magicLinkLimit = (email: string) => ({
  key: `magic-link:email:${email.normalize("NFKC").trim().toLowerCase()}`,
  limit: 5,
  windowMs: 15 * MINUTE,
});

/** "over 12 minuten", voor in een melding. */
export function retryIn(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes <= 1 ? "over een minuut" : minutes >= 60 ? "over een uur" : `over ${minutes} minuten`;
}

export const rateLimitMessage = (retryAfterSeconds: number) => `Te veel pogingen. Probeer het ${retryIn(retryAfterSeconds)} opnieuw.`;

// Een UserError: server actions geven de melding terug in plaats van te gooien.
export class RateLimitError extends UserError {
  constructor(
    readonly result: RateLimitResult,
    message = rateLimitMessage(result.retryAfterSeconds),
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Voor server actions die gooien: een RateLimitError met een Nederlandse melding als de limiet bereikt is. */
export async function assertRateLimit(options: RateLimitOptions, message?: (result: RateLimitResult) => string) {
  const result = await rateLimit(options);
  if (!result.ok) throw new RateLimitError(result, message?.(result));
  return result;
}

// IP-adres van de client, uit de headers van het request (in actions: clientIp(await headers())).
// Achter Vercel of een andere proxy is het eerste adres in x-forwarded-for de client.
// IPv6 groeperen we per /64: zo'n blok heeft één aansluiting en wisselen is anders gratis.
export function clientIp(headers: Pick<Headers, "get">) {
  const candidates = [headers.get("x-forwarded-for")?.split(",")[0], headers.get("x-real-ip")];
  for (const raw of candidates) {
    // Zonder poort ("1.2.3.4:5678", "[::1]:3000") en zonder zone-id ("fe80::1%eth0").
    const ip = raw
      ?.trim()
      .replace(/^(\d+\.\d+\.\d+\.\d+):\d+$/, "$1")
      .replace(/^\[|\](:\d+)?$/g, "")
      .replace(/%.*$/, "");
    if (!ip) continue;
    if (isIPv4(ip)) return ip;
    if (isIPv6(ip)) return ipv6Prefix(ip);
  }
  return "onbekend";
}

function ipv6Prefix(ip: string) {
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  const [head, tail] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = tail === undefined ? left : [...left, ...Array(8 - left.length - right.length).fill("0"), ...right];
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(":")}::/64`;
}
