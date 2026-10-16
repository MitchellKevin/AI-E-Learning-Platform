import { describe, expect, it, vi } from "vitest";
import { RateLimit } from "@/server/models";
import { MINUTE, RateLimitError, assertRateLimit, clientIp, magicLinkLimit, peekRateLimit, rateLimit, rateLimitMessage } from "@/server/services/rate-limit";
import { setupTestDb } from "./helpers/db";

setupTestDb();

const WINDOW = 15 * MINUTE;
// Midden in een venster, zodat de test niet toevallig over een venstergrens valt.
const start = new Date(Math.floor(Date.now() / WINDOW) * WINDOW + 5 * MINUTE);
const later = (ms: number) => new Date(start.getTime() + ms);

describe("rateLimit", () => {
  it("staat precies `limit` aanvragen per venster toe", async () => {
    const opts = { key: "test:email:anna@bedrijf.nl", limit: 3, windowMs: WINDOW, now: start };
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await rateLimit(opts));

    expect(results.map((r) => r.ok)).toEqual([true, true, true, false, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0, 0]);
    expect(results[0].retryAfterSeconds).toBe(0);
    // Nog 10 minuten tot het volgende venster.
    expect(results[3].retryAfterSeconds).toBe(10 * 60);
  });

  it("begint opnieuw in het volgende venster", async () => {
    const opts = { key: "test:ip:1.2.3.4", limit: 2, windowMs: WINDOW };
    await rateLimit({ ...opts, now: start });
    await rateLimit({ ...opts, now: start });
    expect((await rateLimit({ ...opts, now: later(9 * MINUTE) })).ok).toBe(false);
    expect((await rateLimit({ ...opts, now: later(10 * MINUTE) })).ok).toBe(true);
  });

  it("houdt sleutels apart", async () => {
    const base = { limit: 1, windowMs: WINDOW, now: start };
    expect((await rateLimit({ ...base, key: "test:email:a@x.nl" })).ok).toBe(true);
    expect((await rateLimit({ ...base, key: "test:email:a@x.nl" })).ok).toBe(false);
    expect((await rateLimit({ ...base, key: "test:email:b@x.nl" })).ok).toBe(true);
    expect((await rateLimit({ ...base, key: "ander:email:a@x.nl" })).ok).toBe(true);
  });

  it("laat bij gelijktijdige aanvragen er nooit meer dan `limit` door", async () => {
    const opts = { key: "test:race", limit: 10, windowMs: WINDOW, now: start };
    const results = await Promise.all(Array.from({ length: 40 }, () => rateLimit(opts)));
    expect(results.filter((r) => r.ok)).toHaveLength(10);
    // Geweigerde aanvragen zijn teruggedraaid: de teller staat op de limiet.
    const [doc] = await RateLimit.find().lean();
    expect(doc.count).toBe(10);
  });

  it("houdt de limiet ook exact bij gelijktijdige aanvragen met een gewicht", async () => {
    const opts = { key: "test:race-cost", limit: 50, windowMs: WINDOW, now: start, cost: 7 };
    const results = await Promise.all(Array.from({ length: 20 }, () => rateLimit(opts)));
    expect(results.filter((r) => r.ok)).toHaveLength(7);
    const [doc] = await RateLimit.find().lean();
    expect(doc.count).toBe(49);
  });

  it("probeert het één keer opnieuw als een gelijktijdige upsert al een document aanmaakte", async () => {
    const duplicate = Object.assign(new Error("E11000 duplicate key error"), { code: 11000 });
    const spy = vi.spyOn(RateLimit, "findOneAndUpdate");
    spy.mockImplementationOnce((() => ({ lean: () => Promise.reject(duplicate) })) as never);
    try {
      expect(await rateLimit({ key: "test:dup", limit: 2, windowMs: WINDOW, now: start })).toMatchObject({ ok: true, remaining: 1 });
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }
  });

  it("telt een gewicht mee en laat een te grote aanvraag het tegoed niet opmaken", async () => {
    const opts = { key: "test:invites:admin", limit: 100, windowMs: WINDOW, now: start };
    expect(await rateLimit({ ...opts, cost: 60 })).toMatchObject({ ok: true, remaining: 40 });
    expect(await rateLimit({ ...opts, cost: 50 })).toMatchObject({ ok: false, remaining: 40 });
    expect(await rateLimit({ ...opts, cost: 40 })).toMatchObject({ ok: true, remaining: 0 });
  });

  it("bewaart geen e-mail- of IP-adressen en ruimt zichzelf op", async () => {
    await rateLimit({ key: "magic-link:email:anna@bedrijf.nl", limit: 5, windowMs: WINDOW, now: start });
    const [doc] = await RateLimit.find().lean();
    expect(doc.key).toMatch(/^magic-link:/);
    expect(doc.key).not.toContain("anna");
    expect(doc.expiresAt.getTime()).toBeGreaterThan(later(10 * MINUTE).getTime());
  });
});

describe("peekRateLimit", () => {
  it("kijkt zonder mee te tellen", async () => {
    const opts = { key: "test:peek", limit: 2, windowMs: WINDOW, now: start };
    expect(await peekRateLimit(opts)).toMatchObject({ ok: true, remaining: 2 });
    expect(await RateLimit.countDocuments()).toBe(0);

    await rateLimit(opts);
    await rateLimit(opts);
    expect(await peekRateLimit(opts)).toEqual({ ok: false, remaining: 0, retryAfterSeconds: 10 * 60 });
    expect((await RateLimit.findOne().lean())?.count).toBe(2);
    expect((await peekRateLimit({ ...opts, now: later(10 * MINUTE) })).ok).toBe(true);
  });
});

describe("inloglinks", () => {
  // De server action kijkt (peek), Auth.js telt bij het versturen (rateLimit): samen precies vijf per kwartier.
  it("laat vijf aanvragen per kwartier toe, ook al komen ze langs twee plekken", async () => {
    const limit = { ...magicLinkLimit("anna@bedrijf.nl"), now: start };
    const sent = [];
    for (let i = 0; i < 6; i++) {
      if (!(await peekRateLimit(limit)).ok) {
        sent.push(false);
        continue;
      }
      sent.push((await rateLimit(limit)).ok);
    }
    expect(sent).toEqual([true, true, true, true, true, false]);
    expect((await RateLimit.findOne().lean())?.count).toBe(5);
  });

  it("normaliseert het adres zoals Auth.js", () => {
    expect(magicLinkLimit(" Anna@Bedrijf.NL").key).toBe(magicLinkLimit("anna@bedrijf.nl").key);
    expect(magicLinkLimit("ａｎｎａ@bedrijf.nl").key).toBe(magicLinkLimit("anna@bedrijf.nl").key);
  });
});

describe("assertRateLimit", () => {
  it("gooit een RateLimitError met een Nederlandse melding", async () => {
    const opts = { key: "test:assert", limit: 1, windowMs: WINDOW, now: start };
    await assertRateLimit(opts);
    const error = await assertRateLimit(opts).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as Error).message).toBe("Te veel pogingen. Probeer het over 10 minuten opnieuw.");
  });

  it("formuleert de wachttijd leesbaar", () => {
    expect(rateLimitMessage(20)).toContain("een minuut");
    expect(rateLimitMessage(3600)).toContain("een uur");
  });
});

describe("clientIp", () => {
  const ip = (values: Record<string, string>) => clientIp(new Headers(values));

  it("neemt het eerste adres uit x-forwarded-for, daarna x-real-ip", () => {
    expect(ip({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })).toBe("203.0.113.7");
    expect(ip({ "x-real-ip": "198.51.100.2" })).toBe("198.51.100.2");
    expect(ip({ "x-forwarded-for": "geen-ip", "x-real-ip": "198.51.100.2" })).toBe("198.51.100.2");
    expect(ip({})).toBe("onbekend");
  });

  it("haalt poorten weg en groepeert IPv6 per /64", () => {
    expect(ip({ "x-forwarded-for": "203.0.113.7:51234" })).toBe("203.0.113.7");
    expect(ip({ "x-forwarded-for": "::ffff:203.0.113.7" })).toBe("203.0.113.7");
    expect(ip({ "x-forwarded-for": "2001:db8:abcd:12:1::5" })).toBe("2001:db8:abcd:12::/64");
    expect(ip({ "x-forwarded-for": "[2001:db8:abcd:0012:ffff::1]:443" })).toBe("2001:db8:abcd:12::/64");
    expect(ip({ "x-forwarded-for": "::1" })).toBe("0:0:0:0::/64");
  });
});
