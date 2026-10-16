import { NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { isJobName, runJob, type JobOutcome } from "@/server/jobs";
import { isCronAuthorized } from "@/server/jobs/auth";

// Geplande taken. Vercel Cron roept dit aan met "Authorization: Bearer <CRON_SECRET>" (zie vercel.json).

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const httpStatus: Record<JobOutcome["status"], number> = { klaar: 200, overgeslagen: 409, mislukt: 500 };

export async function GET(request: Request, { params }: { params: Promise<{ job: string }> }) {
  // Rechtstreeks uit process.env: een ontbrekend of leeg geheim betekent gewoon "geen toegang".
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 401 });
  }
  const { job } = await params;
  if (!isJobName(job)) return NextResponse.json({ error: "Onbekende taak" }, { status: 404 });

  await connectDb();
  const outcome = await runJob(job);
  return NextResponse.json(outcome, { status: httpStatus[outcome.status] });
}
