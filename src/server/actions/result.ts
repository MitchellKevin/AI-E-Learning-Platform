import { ZodError } from "zod";
import { UserError } from "@/server/errors";

// Resultaat van een server action. Next.js vervangt in productie de melding van een gegooide fout door een
// algemene tekst; verwachte fouten komen daarom terug als data. In de browser: unwrap uit "@/lib/action-result".
// Geen "use server": zo'n bestand mag alleen async functies exporteren.

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const INVALID_INPUT_MESSAGE = "Controleer je invoer en probeer het opnieuw.";

/**
 * Voert de action uit en geeft UserError (ook RateLimitError) en ongeldige invoer (ZodError) terug als
 * { ok: false, error }. Al het andere gooit door, ook redirect() en notFound() van Next.js en signIn/signOut.
 */
export async function guarded<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    if (error instanceof ZodError) return { ok: false, error: INVALID_INPUT_MESSAGE };
    throw error;
  }
}
