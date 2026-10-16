import { afterEach, describe, expect, it, vi } from "vitest";
import { safeNext } from "@/lib/safe-next";
import { Organization, PointEvent, User } from "@/server/models";
import { ssoSignInAllowed } from "@/server/services/membership";
import { recordQuizResult } from "@/server/services/progress";
import { createOrgWithUser, setupTestDb } from "./helpers/db";

setupTestDb();

describe("safeNext", () => {
  it("laat alleen interne paden door", () => {
    expect(safeNext("/leerpaden/ai-101?x=1#top")).toBe("/leerpaden/ai-101?x=1#top");
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "\\\\evil", "javascript:alert(1)", "", undefined, ["/a", "/b"], 42]) {
      expect(safeNext(bad)).toBe("/dashboard");
    }
  });
});

describe("quizpunten", () => {
  it("geeft alleen punten voor een echte quiz- of kennischecktaak", async () => {
    const { user } = await createOrgWithUser();
    await expect(recordQuizResult(user, "a/b", "x1", true)).rejects.toThrow("Onbekende quizvraag");
    await expect(recordQuizResult(user, "ai-101/3-3", "bestaat-niet", true)).rejects.toThrow("Onbekende quizvraag");
    // Taak zonder vragen (alleen tekst) telt ook niet.
    await expect(recordQuizResult(user, "ai-101/3-3", "introductie", true)).rejects.toThrow("Onbekende quizvraag");
    expect(await PointEvent.countDocuments({ userId: user._id })).toBe(0);
  });
});

describe("SSO-tenantcontrole", () => {
  async function ssoOrg() {
    const { org, user } = await createOrgWithUser("Noord", "lid@noord.nl");
    await Organization.updateOne(
      { _id: org._id },
      {
        domains: [{ domain: "noord.nl", verified: true }],
        sso: { provider: "microsoft", status: "verbonden", tenant: "11111111-2222-3333-4444-555555555555" },
      },
    );
    return { org, user };
  }

  it("accepteert alleen tokens uit de eigen tenant", async () => {
    await ssoOrg();
    expect(await ssoSignInAllowed("lid@noord.nl", "microsoft", "11111111-2222-3333-4444-555555555555")).toBe(true);
    // Aanvaller met een eigen tenant die het adres claimt (nOAuth).
    expect(await ssoSignInAllowed("lid@noord.nl", "microsoft", "99999999-0000-0000-0000-000000000000")).toBe(false);
    expect(await ssoSignInAllowed("lid@noord.nl", "microsoft", undefined)).toBe(false);
    expect(await ssoSignInAllowed("lid@noord.nl", "google", "11111111-2222-3333-4444-555555555555")).toBe(false);
  });

  it("weigert organisaties zonder gekoppelde SSO en adressen buiten de geverifieerde domeinen", async () => {
    const { org } = await ssoOrg();
    await User.create({ email: "extern@elders.nl", orgId: org._id });
    expect(await ssoSignInAllowed("extern@elders.nl", "microsoft", "11111111-2222-3333-4444-555555555555")).toBe(false);

    await Organization.updateOne({ _id: org._id }, { "sso.status": "niet-ingesteld" });
    expect(await ssoSignInAllowed("lid@noord.nl", "microsoft", "11111111-2222-3333-4444-555555555555")).toBe(false);
  });
});

describe("demo-login", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("staat in productie alleen aan met een expliciete extra vlag", async () => {
    const { demoLoginEnabled } = await import("@/server/flags");
    vi.stubEnv("DEMO_LOGIN", "true");
    vi.stubEnv("NODE_ENV", "production");
    expect(demoLoginEnabled()).toBe(false);
    vi.stubEnv("DEMO_LOGIN_IN_PRODUCTION", "true");
    expect(demoLoginEnabled()).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEMO_LOGIN", "false");
    expect(demoLoginEnabled()).toBe(false);
  });
});
