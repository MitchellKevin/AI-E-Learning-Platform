import { describe, expect, it } from "vitest";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ActionError, errorMessage, unwrap } from "@/lib/action-result";
import { INVALID_INPUT_MESSAGE, guarded } from "@/server/actions/result";
import { UserError } from "@/server/errors";
import { RateLimitError, rateLimitMessage } from "@/server/services/rate-limit";

describe("guarded", () => {
  it("geeft de data terug als de action slaagt", async () => {
    expect(await guarded(async () => ({ id: "abc" }))).toEqual({ ok: true, data: { id: "abc" } });
    expect(await guarded(async () => {})).toEqual({ ok: true, data: undefined });
  });

  it("geeft de melding van een UserError terug in plaats van te gooien", async () => {
    const result = await guarded(async () => {
      throw new UserError("Geen licentie vrij");
    });
    expect(result).toEqual({ ok: false, error: "Geen licentie vrij" });
  });

  it("geeft de melding van een RateLimitError terug", async () => {
    const error = new RateLimitError({ ok: false, remaining: 0, retryAfterSeconds: 600 });
    expect(error).toBeInstanceOf(UserError);
    expect(error.name).toBe("RateLimitError");
    expect(await guarded(async () => Promise.reject(error))).toEqual({ ok: false, error: rateLimitMessage(600) });

    const custom = new RateLimitError({ ok: false, remaining: 2, retryAfterSeconds: 60 }, "Nog 2 uitnodigingen dit uur.");
    expect(await guarded(async () => Promise.reject(custom))).toEqual({ ok: false, error: "Nog 2 uitnodigingen dit uur." });
  });

  it("geeft bij ongeldige invoer (ZodError) een algemene melding", async () => {
    const result = await guarded(async () => z.object({ email: z.email() }).parse({ email: "geen-adres" }));
    expect(result).toEqual({ ok: false, error: INVALID_INPUT_MESSAGE });
  });

  it("gooit onverwachte fouten door", async () => {
    const error = new Error("Databaseverbinding verbroken");
    await expect(guarded(async () => Promise.reject(error))).rejects.toBe(error);
    await expect(
      guarded(async () => {
        throw new TypeError("x is undefined");
      }),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it("gooit redirect() en notFound() van Next.js door", async () => {
    await expect(guarded(async () => redirect("/dashboard"))).rejects.toMatchObject({
      digest: expect.stringMatching(/^NEXT_REDIRECT;/),
    });
    await expect(guarded(async () => notFound())).rejects.toMatchObject({
      digest: expect.stringMatching(/^NEXT_HTTP_ERROR_FALLBACK;404/),
    });
  });
});

describe("unwrap", () => {
  it("geeft de data van een geslaagde action", () => {
    expect(unwrap({ ok: true, data: 42 })).toBe(42);
    expect(unwrap({ ok: true, data: undefined })).toBeUndefined();
  });

  it("gooit een ActionError met de melding van de server", () => {
    let caught: unknown;
    try {
      unwrap({ ok: false, error: "Dit domein is al gekoppeld" });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ActionError);
    // Bestaande catch-blokken lezen error.message van een Error.
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe("Dit domein is al gekoppeld");
  });

  it("werkt in een promise-keten", async () => {
    await expect(Promise.resolve({ ok: true as const, data: "id" }).then(unwrap)).resolves.toBe("id");
    await expect(Promise.resolve({ ok: false as const, error: "Geen toegang" }).then(unwrap)).rejects.toThrow("Geen toegang");
  });
});

describe("errorMessage", () => {
  it("toont de melding van de server, anders de terugvaltekst", () => {
    expect(errorMessage(new ActionError("Te veel pogingen."), "Probeer het opnieuw.")).toBe("Te veel pogingen.");
    // Een onverwachte fout heeft in productie een algemene Engelse tekst van Next.js.
    expect(errorMessage(new Error("An error occurred in the Server Components render."), "Probeer het opnieuw.")).toBe("Probeer het opnieuw.");
    expect(errorMessage("iets", "Probeer het opnieuw.")).toBe("Probeer het opnieuw.");
  });
});
