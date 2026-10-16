import type { ActionResult } from "@/server/actions/result";

// Browserkant van ActionResult. Alleen een type-import: er komt geen servercode in de bundel.

export type { ActionResult };

/** Een fout die de server bewust teruggaf; de melding is bedoeld voor de gebruiker. */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

/** De data uit een geslaagde action, of een ActionError met de melding van de server. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new ActionError(result.error);
  return result.data;
}

/** De melding van de server als die er is, anders `fallback`. Onverwachte fouten zijn in productie niet leesbaar. */
export function errorMessage(error: unknown, fallback: string) {
  return error instanceof ActionError ? error.message : fallback;
}
