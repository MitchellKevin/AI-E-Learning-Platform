import { afterEach, describe, expect, it, vi } from "vitest";
import { Invite, JobRun } from "@/server/models";
import { addDays } from "@/server/services/dates";
import { isJobName, jobNames, jobs, LOCK_MS, runJob } from "@/server/jobs";
import { isCronAuthorized } from "@/server/jobs/auth";
import { countInBatches } from "@/server/jobs/batch";
import { GET } from "@/app/api/cron/[job]/route";
import { createOrgWithUser, setupTestDb } from "./helpers/db";

setupTestDb();

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.CRON_SECRET;
});

// Een uitnodiging die "opruimen" weghaalt: zo zie je of de taak echt draaide.
async function staleInvite() {
  const { org } = await createOrgWithUser();
  return Invite.create({ token: "oud", orgId: org._id, email: "oud@testorg.nl", expiresAt: addDays(new Date(), -40) });
}

describe("runJob", () => {
  it("kent precies de drie taken", () => {
    expect(jobNames).toEqual(["herinneringen", "leaderboard-maand", "opruimen"]);
    expect(isJobName("opruimen")).toBe(true);
    expect(isJobName("bestaat-niet")).toBe(false);
    expect(isJobName("toString")).toBe(false);
  });

  it("legt de run vast met resultaat en geeft het slot weer vrij", async () => {
    await staleInvite();
    const outcome = await runJob("opruimen");
    expect(outcome).toMatchObject({ job: "opruimen", status: "klaar", result: { uitnodigingen: 1 } });

    const [run] = await JobRun.find({ job: "opruimen" }).lean();
    expect(run).toMatchObject({ status: "klaar", result: { uitnodigingen: 1 } });
    expect(run.finishedAt).toBeInstanceOf(Date);
    expect(run.lockedUntil).toBeUndefined();
  });

  it("slaat over zolang een andere run van dezelfde taak het slot heeft", async () => {
    const invite = await staleInvite();
    await JobRun.create({ job: "opruimen", status: "bezig", lockedUntil: new Date(Date.now() + 60_000) });

    expect(await runJob("opruimen")).toMatchObject({ status: "overgeslagen" });
    expect(await Invite.exists({ _id: invite._id })).toBeTruthy();
    expect(await JobRun.countDocuments({ job: "opruimen" })).toBe(1);
    // Andere taken hebben hun eigen slot.
    expect(await runJob("leaderboard-maand")).toMatchObject({ status: "klaar" });
  });

  it("markeert een run met een verlopen slot als afgebroken en draait gewoon", async () => {
    await staleInvite();
    const stale = await JobRun.create({ job: "opruimen", status: "bezig", lockedUntil: new Date(Date.now() - 1000) });

    expect(await runJob("opruimen")).toMatchObject({ status: "klaar" });
    const old = await JobRun.findById(stale._id).lean();
    expect(old).toMatchObject({ status: "mislukt" });
    expect(old!.lockedUntil).toBeUndefined();
  });

  it("draait nooit twee keer tegelijk", async () => {
    const outcomes = await Promise.all([runJob("opruimen"), runJob("opruimen"), runJob("opruimen")]);
    expect(outcomes.filter((o) => o.status === "klaar").length).toBeLessThanOrEqual(1);
    expect(await JobRun.countDocuments({ lockedUntil: { $ne: null } })).toBe(0);
  });

  it("legt een fout vast en geeft het slot vrij", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(jobs, "opruimen").mockRejectedValueOnce(new Error("Database weg"));

    expect(await runJob("opruimen")).toMatchObject({ status: "mislukt", error: "Database weg" });
    const [run] = await JobRun.find({ job: "opruimen" }).lean();
    expect(run).toMatchObject({ status: "mislukt", error: "Database weg" });
    expect(run.lockedUntil).toBeUndefined();
    // De volgende run wordt niet geblokkeerd.
    expect(await runJob("opruimen")).toMatchObject({ status: "klaar" });
  });

  it("laat een batch eerst afronden voordat een fout doorkomt", async () => {
    const done: number[] = [];
    const run = countInBatches([1, 2, 3], async (n) => {
      if (n === 1) throw new Error("Mis");
      await new Promise((resolve) => setTimeout(resolve, 20));
      done.push(n);
      return true;
    });
    await expect(run).rejects.toThrow("Mis");
    expect(done).toEqual([2, 3]);
  });

  it("houdt het slot ruim langer dan een functie mag duren", () => {
    expect(LOCK_MS).toBeGreaterThan(60_000);
  });
});

describe("toegang tot /api/cron", () => {
  const secret = "een-lang-geheim-van-32-tekens!!!";

  it("vereist precies Bearer <CRON_SECRET>", () => {
    expect(isCronAuthorized(`Bearer ${secret}`, secret)).toBe(true);
    expect(isCronAuthorized(`Bearer ${secret}x`, secret)).toBe(false);
    expect(isCronAuthorized(secret, secret)).toBe(false);
    expect(isCronAuthorized(`bearer ${secret}`, secret)).toBe(false);
    expect(isCronAuthorized(null, secret)).toBe(false);
    // Zonder (bruikbaar) geheim kan niemand erbij.
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
    expect(isCronAuthorized("Bearer undefined", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer kort", "kort")).toBe(false);
  });

  const call = (job: string, authorization?: string) =>
    GET(new Request(`http://localhost/api/cron/${job}`, { headers: authorization ? { authorization } : {} }), {
      params: Promise.resolve({ job }),
    });

  it("geeft 401 zonder geldig geheim, 404 voor een onbekende taak en draait anders de taak", async () => {
    await staleInvite();
    expect((await call("opruimen", `Bearer ${secret}`)).status).toBe(401);

    process.env.CRON_SECRET = secret;
    expect((await call("opruimen")).status).toBe(401);
    expect((await call("opruimen", "Bearer fout")).status).toBe(401);
    expect((await call("bestaat-niet", "Bearer fout")).status).toBe(401);
    expect((await call("bestaat-niet", `Bearer ${secret}`)).status).toBe(404);
    expect(await Invite.countDocuments()).toBe(1);

    const response = await call("opruimen", `Bearer ${secret}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ job: "opruimen", status: "klaar", result: { uitnodigingen: 1 } });
    expect(await Invite.countDocuments()).toBe(0);
  });

  it("geeft 409 als de taak al loopt", async () => {
    process.env.CRON_SECRET = secret;
    await JobRun.create({ job: "opruimen", status: "bezig", lockedUntil: new Date(Date.now() + 60_000) });
    expect((await call("opruimen", `Bearer ${secret}`)).status).toBe(409);
  });
});
