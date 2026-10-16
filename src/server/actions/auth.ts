"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { guarded } from "@/server/actions/result";
import { connectDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { demoLoginEnabled, ssoEnabled } from "@/server/env";
import { MINUTE, assertRateLimit, clientIp, magicLinkLimit, peekRateLimit, rateLimit, rateLimitMessage, retryIn } from "@/server/services/rate-limit";
import { safeNext } from "@/lib/safe-next";

// Inloggen en uitloggen via Auth.js.


export type MagicLinkResult = { ok: true } | { ok: false; error: string };

export async function requestMagicLink(email: string, next?: string): Promise<MagicLinkResult> {
  await connectDb();
  const byIp = await rateLimit({ key: `magic-link:ip:${clientIp(await headers())}`, limit: 100, windowMs: 15 * MINUTE });
  if (!byIp.ok) return { ok: false, error: rateLimitMessage(byIp.retryAfterSeconds) };

  const parsed = z.email().safeParse(email.trim());
  if (!parsed.success) return { ok: false, error: "Dit lijkt geen geldig e-mailadres. Controleer het nog even." };

  // Alleen kijken: Auth.js telt de mail zelf bij het versturen. Zo telt één aanvraag één keer en werken er echt vijf.
  const byEmail = await peekRateLimit(magicLinkLimit(parsed.data));
  if (!byEmail.ok) {
    return { ok: false, error: `Je hebt al een paar inloglinks aangevraagd. Check je inbox of probeer het ${retryIn(byEmail.retryAfterSeconds)} opnieuw.` };
  }

  try {
    const url = await signIn("email", { email: parsed.data, redirectTo: safeNext(next), redirect: false });
    if (typeof url === "string" && url.includes("fout=sso-verplicht")) {
      return { ok: false, error: "Je organisatie logt in via SSO. Gebruik de knop van Microsoft of Google." };
    }
    if (typeof url === "string" && url.includes("error=")) {
      return { ok: false, error: "Versturen lukte niet. Probeer het over een minuut opnieuw." };
    }
    if (typeof url === "string" && url.includes("fout=geen-toegang")) {
      return { ok: false, error: "Voor dit e-mailadres is geen account of uitnodiging gevonden. Vraag je beheerder om je uit te nodigen." };
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: "Versturen lukte niet. Probeer het over een minuut opnieuw." };
    throw error;
  }
}

export async function signInWithSso(provider: "microsoft" | "google", next?: string) {
  return guarded(async () => {
    if (!ssoEnabled[provider]()) throw new UserError("Deze inlogmethode is nog niet ingesteld");
    // Is er al iemand ingelogd, dan koppelt Auth.js het SSO-account aan díe gebruiker. Eerst uitloggen dus.
    await signOut({ redirect: false });
    await signIn(provider === "microsoft" ? "microsoft-entra-id" : "google", { redirectTo: safeNext(next) });
  });
}

export async function signInAsDemo(email: string, next?: string) {
  return guarded(async () => {
    if (!demoLoginEnabled()) throw new UserError("Demo-login staat uit");
    await connectDb();
    await assertRateLimit({ key: `demo-login:ip:${clientIp(await headers())}`, limit: 30, windowMs: 15 * MINUTE });
    try {
      await signIn("demo", { email, redirectTo: safeNext(next) });
    } catch (error) {
      // Bv. een demo-account dat niet in de database staat (CredentialsSignin). De redirect gooit gewoon door.
      if (error instanceof AuthError) throw new UserError("Inloggen als demo lukte niet. Probeer het opnieuw.");
      throw error;
    }
  });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/inloggen?uitgelogd=1" });
}
