/**
 * Draait een geplande taak met de hand, tegen de database uit .env.local.
 * Gebruik: pnpm cron <taak>   (zonder taak: lijst met taken)
 */
import { connectDb, disconnectDb } from "@/server/db";
import { isJobName, jobNames, runJob } from "@/server/jobs";

async function main() {
  const name = process.argv[2];
  if (!name || !isJobName(name)) {
    if (name) console.error(`Onbekende taak: ${name}`);
    console.info(`Gebruik: pnpm cron <taak>\nTaken: ${jobNames.join(", ")}`);
    process.exitCode = name ? 1 : 0;
    return;
  }

  await connectDb();
  try {
    const outcome = await runJob(name);
    console.info(JSON.stringify(outcome, null, 2));
    if (outcome.status !== "klaar") process.exitCode = 1;
  } finally {
    await disconnectDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
