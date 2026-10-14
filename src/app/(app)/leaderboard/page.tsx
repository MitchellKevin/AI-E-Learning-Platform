import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button, PageHeader } from "@/components/kit";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { PointRules } from "@/components/leaderboard/point-rules";
import { PrivacyNote } from "@/components/leaderboard/privacy-note";
import { getLeaderboardOverview, getPointRules } from "@/lib/data/leaderboard";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Leaderboard · AI Academy" };

// Ranglijsten zijn per gebruiker en veranderen continu: per request renderen.
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [overview, rules] = await Promise.all([getLeaderboardOverview(), getPointRules()]);

  return (
    <main className={styles.main}>
      <PageHeader
        eyebrow={`Team ${overview.myTeam}`}
        title="Leaderboard"
        lead="Zie hoe je ervoor staat in je team en in de hele organisatie. Punten verdien je met hoofdstukken, oefeningen en kennischecks."
        actions={
          <Button href="/oefenen" variant="secondary" iconRight={<ArrowRight />}>
            Punten verdienen
          </Button>
        }
      />
      <LeaderboardView
        overview={overview}
        aside={
          <>
            <PointRules rules={rules} />
            <PrivacyNote visible={overview.visible} />
          </>
        }
      />
    </main>
  );
}
