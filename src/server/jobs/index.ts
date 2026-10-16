import { JobRun } from "@/server/models";
import { herinneringen } from "./herinneringen";
import { leaderboardMaand } from "./leaderboard-maand";
import { opruimen } from "./opruimen";

// Geplande taken (Vercel Cron via /api/cron/<taak>, lokaal via `pnpm cron <taak>`).
// Elke taak is idempotent: nog een keer draaien op dezelfde dag of in dezelfde maand doet niets dubbel.

export const jobs = {
  herinneringen,
  "leaderboard-maand": leaderboardMaand,
  opruimen,
} satisfies Record<string, (now?: Date) => Promise<Record<string, unknown>>>;

export type JobName = keyof typeof jobs;
export const jobNames = Object.keys(jobs) as JobName[];
export const isJobName = (name: string): name is JobName => Object.hasOwn(jobs, name);

/** Ruim langer dan een functie op Vercel mag duren (60 s); een afgebroken run blokkeert de volgende dus niet lang. */
export const LOCK_MS = 10 * 60_000;

export type JobOutcome =
  | { job: JobName; status: "klaar"; result: Record<string, unknown>; durationMs: number }
  | { job: JobName; status: "mislukt"; error: string; durationMs: number }
  | { job: JobName; status: "overgeslagen"; reason: string };

const busy = (job: JobName): JobOutcome => ({ job, status: "overgeslagen", reason: "Er loopt al een run van deze taak" });

/**
 * Draait een taak met een slot in JobRun: loopt er al een run (slot nog geldig), dan wordt deze overgeslagen.
 * Het slot gaat over echte tijd; `now` is alleen de tijd waarmee de taak rekent (handig in tests).
 */
export async function runJob(name: JobName, now = new Date()): Promise<JobOutcome> {
  const startedAt = new Date();
  const active = { job: name, lockedUntil: { $gt: startedAt } };

  // Runs waarvan het slot verliep zonder dat ze klaar waren, zijn afgebroken (bijvoorbeeld door een time-out).
  await JobRun.updateMany(
    { job: name, status: "bezig", lockedUntil: { $lte: startedAt } },
    { status: "mislukt", error: "Afgebroken voordat de taak klaar was", finishedAt: startedAt, $unset: { lockedUntil: 1 } },
  );
  if (await JobRun.exists(active)) return busy(name);

  const run = await JobRun.create({ job: name, startedAt, lockedUntil: new Date(startedAt.getTime() + LOCK_MS), status: "bezig" });
  // Starten er twee tegelijk, dan zien ze elkaar hier en wijken ze allebei; de volgende run pakt het op.
  if (await JobRun.exists({ ...active, _id: { $ne: run._id } })) {
    await JobRun.deleteOne({ _id: run._id });
    return busy(name);
  }

  try {
    const result = await jobs[name](now);
    const finishedAt = new Date();
    await JobRun.updateOne({ _id: run._id }, { status: "klaar", result, finishedAt, $unset: { lockedUntil: 1 } });
    return { job: name, status: "klaar", result, durationMs: finishedAt.getTime() - startedAt.getTime() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Taak ${name} mislukt:`, error);
    const finishedAt = new Date();
    await JobRun.updateOne({ _id: run._id }, { status: "mislukt", error: message, finishedAt, $unset: { lockedUntil: 1 } });
    return { job: name, status: "mislukt", error: message, durationMs: finishedAt.getTime() - startedAt.getTime() };
  }
}
